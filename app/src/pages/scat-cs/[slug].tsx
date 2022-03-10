import { GetStaticProps, NextPage } from "next"
import { byId, CrossSection, search } from "../../ScatteringCrossSection/db"

interface Props {
    section: CrossSection
}

const ScatteringCrossSectionPage: NextPage<Props> = ({section}) => {
    return (
        <div>
            <h1>Scattering Cross Section</h1>
            <div>Species: {section.species1} / {section.species2}</div>
            <div>Database: {section.database}</div>
            <div>Group: {section.group}</div>
            <div>
                {section.data}
            </div>
        </div>
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