import { Reference } from "../shared/types"

export interface CrossSectionHeading {
    id: number
    species1: string
    species2: string
    database: string
    group: string
    process: string
    references: Reference[]
}

export interface CrossSection extends CrossSectionHeading {
    data: string
}
