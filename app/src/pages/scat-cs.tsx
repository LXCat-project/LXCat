import { GetServerSideProps, NextPage } from "next"
import { Layout } from "../shared/Layout"
import { Facets, list, searchFacets } from "../ScatteringCrossSection/queries"
import { List } from "../ScatteringCrossSection/List"
import { CrossSectionHeading } from "../ScatteringCrossSection/types/public"
import { Filter } from "../ScatteringCrossSection/Filter"

interface Props {
    items: CrossSectionHeading[]
    facets: Facets
}

const ScatteringCrossSectionsPage: NextPage<Props> = ({items, facets}) => {
    return (
        <Layout title="Scattering Cross Section">
            <h1>Scattering Cross Sections</h1>
            <Filter facets={facets} />
            <hr/>
            <List items={items}/>
        </Layout>
    )
}

export default ScatteringCrossSectionsPage

export const getServerSideProps: GetServerSideProps<Props, Record<keyof Facets, string>> = async (context) => {
    const filter: Record<string, string> = {}
    if (context.params?.set_name) {
        filter.set_name = context.params?.set_name
    }
    if (context.params?.lhs_primary_particle) {
        filter.lhs_primary_particle = context.params?.lhs_primary_particle
    }
    if (context.params?.rhs_primary_particle) {
        filter.rhs_primary_particle = context.params?.rhs_primary_particle
    }
    // TODO filter list using the incoming filter query params
    console.log(filter)
    return {
        props: {
            items: await list(),
            facets: await searchFacets()
        }
    }
}
