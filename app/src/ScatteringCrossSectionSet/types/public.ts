import { CrossSectionHeading, CrossSectionItem } from "../../ScatteringCrossSection/types/public"
import { CrossSectionSet } from "./collection"

export interface CrossSectionSetHeading extends CrossSectionSet {
    id: string
	processes: Omit<CrossSectionHeading, 'isPartOf'>[]
    contributor: string
}

export type OrphanedCrossSectionItem = Omit<CrossSectionItem, 'isPartOf'>

export interface CrossSectionSetItem extends CrossSectionSet {
    id: string
	processes: OrphanedCrossSectionItem[]
    contributor: string
}