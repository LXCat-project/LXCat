import { GetServerSideProps, NextPage } from "next"
import { Layout } from "../shared/Layout"
import { list } from "../ScatteringCrossSection/queries"
import { List } from "../ScatteringCrossSection/List"
import { CrossSectionHeading } from "../ScatteringCrossSection/types/public"

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

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        props: {
            items: await list()
        }
    }
}
