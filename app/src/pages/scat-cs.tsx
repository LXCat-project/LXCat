import { NextPage } from "next"
import { useEffect, useState } from "react"
import { List } from "../ScatteringCrossSection/List"
import { SearchForm } from "../ScatteringCrossSection/SearchForm"
import { CrossSection, facets, search } from "../ScatteringCrossSection/db"
import { Layout } from "../shared/Layout"

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
            const setReplacer = (_key: string, value: unknown) => (value instanceof Set ? [...value] : value)
            const body = JSON.stringify(selection, setReplacer)
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
        <Layout title="Scattering Cross Section">
            <h1>Scattering Cross Sections</h1>
            <SearchForm facets={facets} selection={selection} onChange={onSearchChange} enabledFacets={validFacets}/>
            <span>Filtered {filteredItems.length} of {items.length}</span>
            <List items={filteredItems} />
        </Layout>
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