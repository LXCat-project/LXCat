import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";
import { VersionInfo } from "../../shared/types/version_info";
import { CrossSectionHeading, CrossSectionItem } from "../public";

export async function list() {
  const cursor: ArrayCursor<CrossSectionHeading> = await db().query(aql`
	FOR cs IN CrossSection
		LET refs = (
		FOR rs IN References
			FILTER rs._from == cs._id
			FOR r IN Reference
				FILTER r._id == rs._to
				RETURN UNSET(r, ["_key", "_rev", "_id"])
		)
		LET set = (
		FOR p IN IsPartOf
			FILTER p._from == cs._id
			FOR s IN CrossSectionSet
				FILTER s._id == p._to
				RETURN MERGE(UNSET(s, ["_key", "_rev", "_id"]), {id: s._key})
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
		RETURN { "id": cs._key, "reaction": FIRST(reaction), "reference": refs, "isPartOf": FIRST(set)}
	`);

  return await cursor.all();
}

export async function byId(id: string) {
  const cursor: ArrayCursor<CrossSectionItem> = await db().query(aql`
	FOR cs IN CrossSection
		FILTER cs._key == ${id}
		LET refs = (
		FOR rs IN References
			FILTER rs._from == cs._id
			FOR r IN Reference
				FILTER r._id == rs._to
				RETURN UNSET(r, ["_key", "_rev", "_id"])
		)
		LET set = (
		FOR p IN IsPartOf
			FILTER p._from == cs._id
			FOR s IN CrossSectionSet
				FILTER s._id == p._to
				RETURN MERGE(UNSET(s, ["_key", "_rev", "_id"]), {id: s._key})
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
			{ "id": cs._key, "reaction": FIRST(reaction), "reference": refs, "isPartOf": set}
		)
	`);

  return await cursor.next();
}

export interface Facets {
  set_name: string[];
  species1: string[];
  species2: string[];
}

export async function searchFacets(): Promise<Facets> {
  // TODO fetch facets from db instead of processing list() return
  const all = await list();
  return {
    set_name: [...new Set(all.map((d) => d.isPartOf.name))],
    species1: [...new Set(all.flatMap((d) => d.reaction.lhs[0].state.id))],
    species2: [...new Set(all.flatMap((d) => d.reaction.lhs[1].state.id))],
  };
}

export interface SearchOptions {
  set_name: string[];
  species1: string[];
  species2: string[];
}

export async function search(options: SearchOptions) {
  const cursor: ArrayCursor<CrossSectionHeading> = await db().query(aql`
	FOR cs IN CrossSection
		LET refs = (
			FOR rs IN References
				FILTER rs._from == cs._id
				FOR r IN Reference
					FILTER r._id == rs._to
					RETURN UNSET(r, ["_key", "_rev", "_id"])
		)
		LET set = FIRST(
			FOR p IN IsPartOf
				FILTER p._from == cs._id
				FOR s IN CrossSectionSet
					FILTER s._id == p._to
					RETURN UNSET(s, ["_key", "_rev", "_id"])
		)
		LET reaction = FIRST(
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
		FILTER LENGTH(${options.set_name}) == 0 OR ${options.set_name} ANY == set.name
		FILTER LENGTH(${options.species1}) == 0 OR ${options.species1} ANY == reaction.lhs[0].state.id
		FILTER LENGTH(${options.species2}) == 0 OR ${options.species2} ANY == reaction.lhs[1].state.id
		RETURN { "id": cs._key, "reaction": reaction, "reference": refs, "isPartOf": set}
	`);
  return await cursor.all();
}

export interface KeyedVersionInfo extends VersionInfo {
  _key: string;
}

/**
 * Finds all previous versions of set with key
 */
export async function historyOfSection(key: string) {
  const id = `CrossSection/${key}`;
  const cursor: ArrayCursor<KeyedVersionInfo> = await db().query(aql`
	  FOR h
		IN 0..9999999
		ANY ${id}
		CrossSectionHistory
		FILTER h.versionInfo.status != 'draft'
		SORT h.versionInfo.version DESC
		RETURN MERGE({_key: h._key}, h.versionInfo)
	`);
  return await cursor.all();
}
