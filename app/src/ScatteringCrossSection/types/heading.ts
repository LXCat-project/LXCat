import { Reference } from "../../shared/types/reference"
import { Reaction } from "../../shared/types/reaction"
import { CrossSectionSet } from "./collections"
import { State } from "../../shared/types/collections"

export interface CrossSectionHeading {
	id: string
	isPartOf: CrossSectionSet
	reaction: Reaction<State>
	reference: Reference[]
	// TODO add CrossSection.threshold?
}
