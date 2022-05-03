import { GetServerSideProps, NextPage } from "next"
import { Layout } from "../shared/Layout"
import { Facets, list, search, searchFacets, SearchOptions } from "../ScatteringCrossSection/queries"
import { List } from "../ScatteringCrossSection/List"
import { CrossSectionHeading } from "../ScatteringCrossSection/types/public"
import { Filter } from "../ScatteringCrossSection/Filter"
import { useRouter } from "next/router"
import { ParsedUrlQuery } from "querystring"

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

function query2array(set_name: string | string[] | undefined): string[] {
    if (set_name) {
        if (typeof set_name === 'string') {
            return [set_name]
        } else {
            return set_name
        }
    } else {
        return []
    }
}
