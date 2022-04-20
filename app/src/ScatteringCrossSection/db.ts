import { Dict } from "arangojs/connection";
import { insert_document, insert_edge, insert_reaction_with_dict, insert_reference_dict, insert_state_dict, upsert_document } from "../db";
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
}