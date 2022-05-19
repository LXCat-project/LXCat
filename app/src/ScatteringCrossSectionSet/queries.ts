import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../db";
import { insert_cs_with_dict } from "../ScatteringCrossSection/queries";
import { insert_document, insert_edge, insert_reference_dict, insert_state_dict, upsert_document } from "../shared/queries";
import { CrossSectionSetInput } from "./types";
import { CrossSectionSetHeading, CrossSectionSetItem } from "./types/public";

export async function insert_input_set(dataset: CrossSectionSetInput) {
    const cs_set_id = await insert_document('CrossSectionSet', {
		name: dataset.name,
		description: dataset.description,
		complete: dataset.complete,
	});

	const contributor = await upsert_document('Contributor', {
		name: dataset.contributor,
	});

	await insert_edge('Provides', contributor.id, cs_set_id);

	const state_ids = await insert_state_dict(dataset.states);
	const reference_ids = await insert_reference_dict(dataset.references);

	for (const cs of dataset.processes) {
		const cs_id = await insert_cs_with_dict(cs, state_ids, reference_ids);
		await insert_edge('IsPartOf', cs_id, cs_set_id);
	}
	return cs_set_id.replace('CrossSectionSet/', '')
}

export async function search() {
    const cursor: ArrayCursor<CrossSectionSetHeading> = await db.query(aql`
    FOR css IN CrossSectionSet
        LET processes = (
            FOR m IN IsPartOf
                FILTER m._to == css._id
                FOR cs IN CrossSection
                    FILTER cs._id == m._from
                    FOR r in Reaction
                        FILTER r._id == cs.reaction
                        LET consumes = (
                            FOR c IN Consumes
                            FILTER c._from == r._id
                                FOR c2s IN State
                                FILTER c2s._id == c._to
                                RETURN {state: {id: c2s.id}}
                        )
                        RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes})
            )
        LET contributors = (
            FOR p IN Provides
                FILTER p._to == css._id
                FOR c IN Contributor
                    FILTER c._id == p._from
                    RETURN c.name
        )
        RETURN MERGE({'id': css._key, processes, contributor: FIRST(contributors)}, UNSET(css, ["_key", "_rev", "_id"]))
    `)
    return await cursor.all()
}

export async function byId(id: string) {
    const cursor: ArrayCursor<CrossSectionSetItem> = await db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${id}
        LET processes = (
            FOR m IN IsPartOf
                FILTER m._to == css._id
                FOR cs IN CrossSection
                    FILTER cs._id == m._from
                    LET refs = (
                        FOR rs IN References
                            FILTER rs._from == cs._id
                            FOR r IN Reference
                                FILTER r._id == rs._to
                                RETURN UNSET(r, ["_key", "_rev", "_id"])
                        )
                    LET reaction = (
                    FOR r in Reaction
                        FILTER r._id == cs.reaction
                        LET consumes = (
                            FOR c IN Consumes
                            FILTER c._from == r._id
                                FOR c2s IN State
                                FILTER c2s._id == c._to
                                RETURN {state: UNSET(c2s, ["_key", "_rev", "_id"]), count: c.count}
                        )
                        LET produces = (
                            FOR p IN Produces
                            FILTER p._from == r._id
                                FOR p2s IN State
                                FILTER p2s._id == p._to
                                RETURN {state: UNSET(p2s, ["_key", "_rev", "_id"]), count: p.count}
                        )
                        RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes}, {"rhs": produces})
                    )
                    RETURN MERGE(
                        UNSET(cs, ["_key", "_rev", "_id"]),
                        { "id": cs._key, "reaction": FIRST(reaction), "reference": refs}
                    )
            )
        LET contributors = (
            FOR p IN Provides
                FILTER p._to == css._id
                FOR c IN Contributor
                    FILTER c._id == p._from
                    RETURN c.name
        )
        RETURN MERGE({'id': css._key, processes, contributor: FIRST(contributors)}, UNSET(css, ["_key", "_rev", "_id"]))
    `);

	return await cursor.next()
}