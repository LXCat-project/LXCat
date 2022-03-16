import { GetStaticProps, NextPage } from "next"
import { byId, search } from "../../ScatteringCrossSection/db"
import { Section } from "../../ScatteringCrossSection/Section"
import { CrossSection } from "../../ScatteringCrossSection/types"
import { HowToCiteCheck } from "../../ScatteringCrossSection/HowToCiteCheck"
import { Layout } from "../../shared/Layout"

interface Props {
    section: CrossSection
}

const ScatteringCrossSectionPage: NextPage<Props> = ({section}) => {
    return (
        <Layout title={`Scattering Cross Section of ${section.species1} / ${section.species2}`}>
            <HowToCiteCheck references={section.references}>
                <Section section={section}></Section>
            </HowToCiteCheck>
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