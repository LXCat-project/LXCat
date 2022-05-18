import { GetServerSideProps, NextPage } from "next"
import Link from "next/link"
import { search } from "../../ScatteringCrossSectionSet/queries"
import { CrossSectionSetHeading } from "../../ScatteringCrossSectionSet/types/public"
import { Layout } from "../../shared/Layout"

interface Props {
    items: CrossSectionSetHeading[]
}

const Card = ({ set }: { set: CrossSectionSetHeading }) => {
    return (
        <div>
            <Link href={`/scat-css/${set.id}`}>
                <a>{set.name}</a>
            </Link>
        </div>
    )
}

const ScatteringCrossSectionSetsPage: NextPage<Props> = ({ items }) => {
    return (
        <Layout title="Scattering Cross Section sets">
            <h1>Scattering Cross Section set</h1>
            <div>
                TODO filter on species and/or contributor.
            </div>
            <hr />
            <div>
                {items.map(set => <Card key={set.id} set={set} />)}
            </div>
        </Layout>
    )
}

export default ScatteringCrossSectionSetsPage

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
    const items = await search()
    return {
        props: {
            items,
        }
    }
}