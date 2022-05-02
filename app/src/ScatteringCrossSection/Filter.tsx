import Link from "next/link"
import { CheckBoxGroup } from "./CheckBoxGroup"
import { Facets, SearchOptions } from "./queries"

interface Props {
    facets: Facets
    selection: SearchOptions
}

export const Filter = ({ facets, selection }: Props) => {
    const hasAnySelection = Object.values(selection).some(s => s.length > 0)
    return (
        <div>
            <div style={{ display: 'flex' }}>
                <fieldset>
                    <legend>Primary consumed particle</legend>
                    <CheckBoxGroup
                        facet={facets.lhs_primary_particle}
                        selection={selection}
                        selectionKey="lhs_primary_particle"
                    />
                </fieldset>
                <fieldset>
                    <legend>Primary produced particle</legend>
                    <CheckBoxGroup
                        facet={facets.rhs_primary_particle}
                        selection={selection}
                        selectionKey="rhs_primary_particle"
                    />
                </fieldset>
                <fieldset>
                    <legend>Set</legend>
                    <CheckBoxGroup
                        facet={facets.set_name}
                        selection={selection}
                        selectionKey="set_name"
                    />
                </fieldset>
            </div>
            <div>
                <Link href={{
                    pathname: '/scat-cs'
                }} passHref>
                    <button disabled={!hasAnySelection}>Clear selection</button>
                </Link>
            </div>
        </div>
    )
}