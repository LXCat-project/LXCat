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



export interface FilterOptions {
	contributor: string[]
	species2: string[]
}

export interface SortOptions {
   field: 'name' | 'contributor'
   dir: 'ASC' | 'DESC'
}

export interface PagingOptions {
    offset: number
    count: number
}

export async function search(filter: FilterOptions, sort: SortOptions, paging: PagingOptions) {
    let contributor_aql = aql``
    if (filter.contributor.length > 0) {
        contributor_aql = aql`FILTER ${filter.contributor} ANY == contributor`
    }
    let species2_aql = aql``
    if (filter.species2.length > 0) {
        // TODO what should this filter do?
        // Now a set matches when one of reactions has its second consumed species equal to one in given filter
        species2_aql = aql`
        LET species2 = (
            FOR p IN processes
                RETURN p.reaction.lhs[1].state.id
        )
        FILTER species2 ANY IN ${filter.species2}
        `
    }
    let sort_aql = aql``
    if (sort.field === 'name') {
        sort_aql = aql`SORT css.name ${sort.dir}`
    } else if (sort.field === 'contributor') {
        sort_aql = aql`SORT contributor ${sort.dir}`
    }
    const limit_aql = aql`LIMIT ${paging.offset}, ${paging.count}`
    const q = aql`
    FOR css IN CrossSectionSet
        LET processes = (
            FOR m IN IsPartOf
                FILTER m._to == css._id
                FOR cs IN CrossSection
                    FILTER cs._id == m._from
                        LET reaction = FIRST(
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
                    RETURN {id: cs._key, reaction}
            )
        LET contributor = FIRST(
            FOR p IN Provides
                FILTER p._to == css._id
                FOR c IN Contributor
                    FILTER c._id == p._from
                    RETURN c.name
        )
        ${contributor_aql}
        ${species2_aql}
        ${sort_aql}
        ${limit_aql}
        RETURN MERGE({'id': css._key, processes, contributor}, UNSET(css, ["_key", "_rev", "_id"]))
    `
    const cursor: ArrayCursor<CrossSectionSetHeading> = await db.query(q)
    return await cursor.all()
}

export interface Facets {
	contributor: string[]
	species2: string[]
}

export async function searchFacets(): Promise<Facets> {
    return {
        contributor: await searchContributors(),
        species2: await searchSpecies2()
    }
}

async function searchContributors() {
    const cursor: ArrayCursor<string> = await db.query(aql`
    FOR css IN CrossSectionSet
        FOR p IN Provides
            FILTER p._to == css._id
            FOR c IN Contributor
                FILTER p._from == c._id
                RETURN DISTINCT c.name
    `)
    return await cursor.all()
}

async function searchSpecies2() {
    const cursor: ArrayCursor<string> = await db.query(aql`
    FOR css IN CrossSectionSet
        FOR m IN IsPartOf
            FILTER m._to == css._id
            FOR cs IN CrossSection
                FILTER cs._id == m._from
                FOR r in Reaction
                    FILTER r._id == cs.reaction
                    LET lhs = LAST(
                        FOR c IN Consumes
                            FILTER c._from == r._id
                            FOR c2s IN State
                                FILTER c2s._id == c._to
                                RETURN c2s.id
                    )
                    RETURN DISTINCT lhs
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