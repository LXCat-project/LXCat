import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../db";
import { CrossSectionSetHeading, CrossSectionSetItem } from "./types/public";

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