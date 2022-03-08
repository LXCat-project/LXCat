import { validFacets } from "../../db"
import { CheckBoxGroup } from "../form/CheckBoxGroup"

interface Props {
    facets: Record<string, string[]>
    enabledFacets: Record<string, string[]>
    selection: Record<string, Set<string>>
    onChange: (s: Record<string, Set<string>>) => void
}

export function SearchForm({ facets, selection, onChange, enabledFacets }: Props) {
    function onCheckBoxGroupChange(k: string, v: Set<string>) {
        const newSelection = { ...selection }
        newSelection[k] = v
        onChange(newSelection)
    }

    return (
        <div style={{ display: 'flex' }}>
            <fieldset>
                <legend>First species</legend>
                <CheckBoxGroup
                    name="species1"
                    choices={facets.species1}
                    selected={selection.species1}
                    setSelected={(s) => onCheckBoxGroupChange('species1', s)}
                    enabled={enabledFacets.species1}
                />
            </fieldset>
            <fieldset>
                <legend>Second species</legend>
                <CheckBoxGroup
                    name="species2"
                    choices={facets.species2}
                    selected={selection.species2}
                    setSelected={(s) => onCheckBoxGroupChange('species2', s)}
                    enabled={enabledFacets.species2}
                />
            </fieldset>
            <fieldset>
                <legend>Database</legend>
                <CheckBoxGroup
                    name="database"
                    choices={facets.database}
                    selected={selection.database}
                    setSelected={(s) => onCheckBoxGroupChange('database', s)}
                    enabled={enabledFacets.database}
                />
            </fieldset>
            <fieldset>
                <legend>Group</legend>
                <CheckBoxGroup
                    name="group"
                    choices={facets.group}
                    selected={selection.group}
                    setSelected={(s) => onCheckBoxGroupChange('group', s)}
                    enabled={enabledFacets.group}
                />
            </fieldset>
            <fieldset>
                <legend>Process</legend>
                <CheckBoxGroup
                    name="process"
                    choices={facets.process}
                    selected={selection.process}
                    setSelected={(s) => onCheckBoxGroupChange('process', s)}
                    enabled={enabledFacets.process}
                />
            </fieldset>
        </div>
    )
}
