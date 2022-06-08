import { aql } from "arangojs";
import { Dict } from "arangojs/connection";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../db";
import { now } from "../shared/date";
import {
  insert_document,
  insert_edge,
  insert_reaction_with_dict,
} from "../shared/queries";
import { VersionInfo } from "../shared/types/version_info";
import { CrossSection } from "./types";
import { CrossSectionHeading, CrossSectionItem } from "./types/public";

export async function insert_cs_with_dict(
  cs: CrossSection<string, string>,
  state_dict: Dict<string>,
  ref_dict: Dict<string>,
  organization: string
): Promise<string> {
  const r_id = await insert_reaction_with_dict(state_dict, cs.reaction);
  const ref_ids = cs.reference?.map((value: string) => ref_dict[value]);

  delete (cs as any)["reference"];
  delete (cs as any)["reaction"];

  const versionInfo: VersionInfo = {
    status: "published",
    version: "1",
    createdOn: now(),
  };
  const cs_id = await insert_document("CrossSection", {
    ...cs,
    reaction: r_id,
    versionInfo,
    organization,
  });

  if (ref_ids) {
    for (const id of ref_ids) {
      await insert_edge("References", cs_id, id);
    }
  }

  return cs_id;
}

export async function list() {
  const cursor: ArrayCursor<CrossSectionHeading> = await db.query(aql`
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
  const cursor: ArrayCursor<CrossSectionItem> = await db.query(aql`
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
			{ "id": cs._key, "reaction": FIRST(reaction), "reference": refs, "isPartOf": FIRST(set)}
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
  const cursor: ArrayCursor<CrossSectionHeading> = await db.query(aql`
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

/*

# TODO Actions

## Create new draft cross section

* Add to CrossSection with status=='draft' and version=='1'
* Insert into Organization, Reaction, State, Reference collection or reuse existing

## Update existing cross section by creating a draft

* Add to CrossSection with status=='draft'
* For draft version = prev version + 1
* Insert into Organization, Reaction, State, Reference collection or reuse existing
* Add previous version and current version to CrossSectionHistory collection

## Update cross section set draft

* Insert into Organization, Reaction, State, Reference collection or reuse existing

## Publish new draft cross section

* Change status of draft section to published

## Publish updated draft cross section

In transaction do:
1. Find sets with current published section
  * Update IsPartOf collection to draft section
  * Create new version of each set (see chapter below)
2. Change status of current published section to archived.
  * have check so a crosssection can only be in sets from same organization
3. Change status of draft section to published

## Retract cross section

* Change status of published section to retracted
* Set retract message
1. Find sets with current published section
  * give choice or
    * remove cross section from set and create new set version
    * or retract the set

*/
