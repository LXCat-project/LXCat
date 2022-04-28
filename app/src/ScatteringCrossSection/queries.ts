import { Dict } from "arangojs/connection";
import { db } from "../db";
import { insert_document, insert_edge, insert_reaction_with_dict, insert_reference_dict, insert_state_dict, upsert_document } from "../shared/queries";

import { ArrayCursor } from "arangojs/cursor";
import { aql } from "arangojs";
import { CrossSectionItem, CrossSectionHeading } from "./types/public";
import { CrossSection, CrossSectionInput } from "./types";

// TODO split into shared and cs only documents
enum Document {
	Particle = "Particle",
	State = "State",
	Reaction = "Reaction",
	CrossSection = "CrossSection",
	CrossSectionSet = "CrossSectionSet",
	Contributor = "Contributor",
	Reference = "Reference",
}

async function insert_cs_with_dict(
	cs: CrossSection<string, string>,
	state_dict: Dict<string>,
	ref_dict: Dict<string>
): Promise<string> {
	const r_id = await insert_reaction_with_dict(state_dict, cs.reaction);
	const ref_ids = cs.reference?.map((value: string) => ref_dict[value]);

	delete (cs as any)["reference"];
	delete (cs as any)["reaction"];

	const cs_id = await insert_document(Document.CrossSection, {
		...cs,
		reaction: r_id,
	});

	await insert_edge('HasCS', r_id, cs_id);

	if (ref_ids) {
		for (const id of ref_ids) {
			await insert_edge('References', cs_id, id);
		}
	}

	return cs_id;
}

export async function insert_input_set(dataset: CrossSectionInput<any>) {
    const cs_set_id = await insert_document(Document.CrossSectionSet, {
		name: dataset.name,
		description: dataset.description,
		complete: dataset.complete,
	});

	const contributor = await upsert_document(Document.Contributor, {
		name: dataset.contributor,
	});

	await insert_edge('Provides', contributor.id, cs_set_id);

	const state_ids = await insert_state_dict(dataset.states);
	const reference_ids = await insert_reference_dict(dataset.references);

	for (const cs of dataset.processes) {
		const cs_id = await insert_cs_with_dict(cs, state_ids, reference_ids);
		await insert_edge('IsPartOf', cs_id, cs_set_id);
	}
	return cs_set_id
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
		  RETURN UNSET(s, ["_key", "_rev", "_id"])
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

	return await cursor.all()
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
		  RETURN UNSET(s, ["_key", "_rev", "_id"])
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
	  {id: cs._key, "reaction": FIRST(reaction), "reference": refs, "isPartOf": FIRST(set)}
	)
	`);

	return await cursor.next()
}