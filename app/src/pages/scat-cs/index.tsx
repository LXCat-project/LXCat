import { GetServerSideProps, NextPage } from "next"
import { Layout } from "../../shared/Layout"
import { Facets, search, searchFacets, SearchOptions } from "../../ScatteringCrossSection/queries"
import { List } from "../../ScatteringCrossSection/List"
import { CrossSectionHeading } from "../../ScatteringCrossSection/types/public"
import { Filter } from "../../ScatteringCrossSection/Filter"
import { useRouter } from "next/router"
import { ParsedUrlQuery } from "querystring"
import { query2array } from "../../shared/query2array"

interface Props {
    items: CrossSectionHeading[]
    facets: Facets
}

const ScatteringCrossSectionsPage: NextPage<Props> = ({items, facets}) => {
    const router = useRouter()
    const selection = query2options(router.query)
    return (
        <Layout title="Scattering Cross Section">
            <h1>Scattering Cross Sections</h1>
            <Filter facets={facets} selection={selection}/>
            <hr/>
            <List items={items}/>
        </Layout>
    )
}

export default ScatteringCrossSectionsPage

export const getServerSideProps: GetServerSideProps<Props, Record<keyof SearchOptions, string[]>> = async (context) => {
    const filter: SearchOptions = query2options(context.query)
    const items = await search(filter)
    return {
        props: {
            items,
            facets: await searchFacets()
        }
    }
}

function query2options(query: ParsedUrlQuery): SearchOptions {
    return {
        set_name: query2array(query.set_name),
        species1: query2array(query.species1),
        species2: query2array(query.species2)
    }
}
