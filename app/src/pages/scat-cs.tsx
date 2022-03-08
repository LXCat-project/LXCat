import { NextPage } from "next"
import { useEffect, useState } from "react"
import { List } from "../components/ScatteringCrossSection/List"
import { SearchForm } from "../components/ScatteringCrossSection/SearchForm"
import { CrossSection, facets, search } from "../db"

interface Props {
    items: CrossSection[]
    facets: Record<string, string[]>
}

const ScatteringCrossSectionsPage: NextPage<Props> = ({ items, facets }) => {
    const [filteredItems, setFilteredItems] = useState(items)
    const [selection, setSelection] = useState({
        species1: new Set<string>(),
        species2: new Set<string>(),
        database: new Set<string>(),
        group: new Set<string>(),
        process: new Set<string>(),
    })
    const [validFacets, setValidFacets] = useState(facets)

    useEffect(() => {
        async function fetchData() {
            const body = JSON.stringify(selection, (_key, value) => (value instanceof Set ? [...value] : value))
            const resp = await fetch('/api/scat-cs', { method: 'POST', body })
            const data = await resp.json()
            setFilteredItems(data.data)
            setValidFacets(data.validFacets)
        }
        fetchData()
    }, [selection])

    async function onSearchChange(newSelection: Record<keyof CrossSection, Set<string>>) {
        setSelection(newSelection)
    }
    return (
        <div>
            <h1>Scattering Cross Sections</h1>
            <SearchForm facets={facets} selection={selection} onChange={onSearchChange} enabledFacets={validFacets}/>
            <span>Filtered {filteredItems.length} of {items.length}</span>
            <List items={filteredItems} />
        </div>
    )
}

export default ScatteringCrossSectionsPage

export async function getStaticProps() {
    return {
        props: {
            items: await search(),
            facets: await facets()
        }
    }
}