import { NextPage } from "next"
import { Layout } from "../shared/Layout"
import { CrossSectionHeading, list } from "../ScatteringCrossSection/queries"
import { List } from "../ScatteringCrossSection/List"

interface Props {
    items: CrossSectionHeading[]
}

const ScatteringCrossSectionsPage: NextPage<Props> = ({items}) => {
    return (
        <Layout title="Scattering Cross Section">
            <h1>Scattering Cross Sections</h1>
            TODO filter
            <List items={items}/>
        </Layout>
    )
}

export default ScatteringCrossSectionsPage

export async function getStaticProps() {
    return {
        props: {
            items: await list()
        }
    }
}
