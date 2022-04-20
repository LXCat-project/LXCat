import { GetStaticProps, NextPage } from "next"
import { CrossSection } from "../../ScatteringCrossSection/types"
import { TermsOfUseCheck } from "../../shared/TermsOfUseCheck"
import { Layout } from "../../shared/Layout"

interface Props {
    section: CrossSection<any>
}

const ScatteringCrossSectionPage: NextPage<Props> = ({section}) => {
    return (
        <div>
            TODO fetch cross section from DB
        </div>
    )
}

export default ScatteringCrossSectionPage

// export async function getStaticPaths() {
//     const sections = await search()
//     const paths = sections.map(p => ({ params: {slug: p.id.toString()} }))
//     return {
//         paths,
//         fallback: false
//     };
// }

// export const getStaticProps: GetStaticProps<Props, {slug: string}> = async (context) => {
//     const slug = context.params?.slug
//     const section = await byId(Number(slug))
//     return {
//         props: {section}
//     }
// }