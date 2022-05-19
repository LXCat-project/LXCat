import Link from "next/link"
import { CheckBoxGroup } from "../shared/CheckBoxGroup"
import { Facets, FilterOptions } from "./queries"

interface Props {
    facets: Facets
    selection: FilterOptions
}

export const Filter = ({ facets, selection }: Props) => {
    const hasAnySelection = Object.values(selection).some(s => s.length > 0)
    return (
        <div>
            <div style={{ display: 'flex' }}>
                <fieldset>
                    <legend>Second species</legend>
                    <CheckBoxGroup
                        facet={facets.species2}
                        selection={selection}
                        selectionKey="species2"
                        path="/scat-css"
                    />
                </fieldset>
                <fieldset>
                    <legend>Contributor</legend>
                    <CheckBoxGroup
                        facet={facets.contributor}
                        selection={selection}
                        selectionKey="contributor"
                        path="/scat-css"
                    />
                </fieldset>
            </div>
            <div>
                <Link href={{
                    pathname: '/scat-css'
                }} passHref>
                    <button disabled={!hasAnySelection}>Clear selection</button>
                </Link>
            </div>
        </div>
    )
}