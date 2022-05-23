import { Reference } from "../../shared/types/reference"
import { Reaction } from "../../shared/types/reaction"
import { CrossSection } from "./collections"
import { CrossSectionSet } from "../../ScatteringCrossSectionSet/types/collection"
import { State } from "../../shared/types/collections"

export interface CrossSectionHeading {
	id: string
	isPartOf: CrossSectionSet
	reaction: Reaction<State>
	reference: Reference[]
	// TODO add CrossSection.threshold?
}

export type CrossSectionItem = {
	id: string
	isPartOf: CrossSectionSet & {id: string}
	reaction: Reaction<State>
	reference: Reference[]
} & Omit<CrossSection, 'reaction'>
