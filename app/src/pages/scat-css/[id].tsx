import { GetServerSideProps, NextPage } from "next"
import Link from "next/link"
import { ReactionSummary } from "../../ScatteringCrossSection/ReactionSummary"
import { byId } from "../../ScatteringCrossSectionSet/queries"
import { CrossSectionSetItem, OrphanedCrossSectionItem } from "../../ScatteringCrossSectionSet/types/public"
import { Layout } from "../../shared/Layout"

interface Props {
    set: CrossSectionSetItem
}

const Process = (props: OrphanedCrossSectionItem) => {
    return (
        <li>
            <Link href={`/scat-cs/${props.id}`}>
                <a>
                    <ReactionSummary {...props.reaction} />
                </a>
            </Link>
        </li>
    )
}

const ScatteringCrossSectionPage: NextPage<Props> = ({ set }) => {
    return (
        <Layout title={`Scattering Cross Section set - ${set.name}`}>
            <h1>{set.name}</h1>
            <div>{set.description}</div>
            <div>Contributed by {set.contributor}</div>
            <div>Complete: {set.complete ? 'Yes' : 'No'}</div>
            <ul>
                <li><a href={`/api/scat-css/${set.id}`}>Download JSON format</a></li>
                <li><a href="TODO">Download Bolsig+ format</a></li>
            </ul>
            <h2>Processes</h2>
            <ol>
                {set.processes.map(p => <Process {...p} key={p.id} />)}
            </ol>
        </Layout>
    )
}

export default ScatteringCrossSectionPage

export const getServerSideProps: GetServerSideProps<Props, { id: string }> = async (context) => {
    const id = context.params?.id!
    const set = await byId(id)
    if (set === undefined) {
        return {
            notFound: true
        }
    }
    return {
        props: { set }
    }
}