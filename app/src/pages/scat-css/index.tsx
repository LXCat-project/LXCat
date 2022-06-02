import { GetServerSideProps, NextPage } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { ParsedUrlQuery } from "querystring"
import { Filter } from "../../ScatteringCrossSectionSet/Filter"
import { List } from "../../ScatteringCrossSectionSet/List"
import { Facets, FilterOptions, search, searchFacets, SortOptions } from "../../ScatteringCrossSectionSet/queries"
import { CrossSectionSetHeading } from "../../ScatteringCrossSectionSet/types/public"
import { Layout } from "../../shared/Layout"
import { query2array } from "../../shared/query2array"

interface Props {
    items: CrossSectionSetHeading[]
    facets: Facets
}


const ScatteringCrossSectionSetsPage: NextPage<Props> = ({ items, facets }) => {
    const router = useRouter()
    const selection = query2options(router.query)
    return (
        <Layout title="Scattering Cross Section sets">
            <h1>Scattering Cross Section set</h1>
            <Filter facets={facets} selection={selection}/>
            <hr />
            <List items={items}/>
        </Layout>
    )
}

export default ScatteringCrossSectionSetsPage

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
    const filter = query2options(context.query)
    // TODO make adjustable by user
    const sort: SortOptions = {
        field: 'name',
        dir: 'ASC'
    }
    const paging = {
        offset: 0,
        count: Number.MAX_SAFE_INTEGER
    }
    const items = await search(filter, sort, paging)
    const facets = await searchFacets()
    return {
        props: {
            items,
            facets
        }
    }
}

function query2options(query: ParsedUrlQuery): FilterOptions {
    return {
        contributor: query2array(query.contributor),
        species2: query2array(query.species2)
    }
}