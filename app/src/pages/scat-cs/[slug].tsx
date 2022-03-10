import { GetStaticProps, NextPage } from "next"
import { byId, CrossSection, search } from "../../ScatteringCrossSection/db"
import { Layout } from "../../shared/Layout"

interface Props {
    section: CrossSection
}

const ScatteringCrossSectionPage: NextPage<Props> = ({section}) => {
    return (
        <Layout title={`Scattering Cross Section of ${section.species1} / ${section.species2}`}>
            <h1>Scattering Cross Section</h1>
            <div>Species: {section.species1} / {section.species2}</div>
            <div>Database: {section.database}</div>
            <div>Group: {section.group}</div>
            <div>
                {section.data}
            </div>
        </Layout>
    )
}

export default ScatteringCrossSectionPage

export async function getStaticPaths() {
    const sections = await search()
    const paths = sections.map(p => ({ params: {slug: p.id.toString()} }))
    return {
        paths,
        fallback: false
    };
}

export const getStaticProps: GetStaticProps<Props, {slug: string}> = async (context) => {
    const slug = context.params?.slug
    const section = await byId(Number(slug))
    return {
        props: {section}
    }
}