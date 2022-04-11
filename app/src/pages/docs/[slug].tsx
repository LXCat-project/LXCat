import { R_OK } from "constants"
import { access, readdir, readFile } from "fs/promises"
import { GetStaticProps, NextPage } from "next"
import { join } from "path"
import { remark } from 'remark'
import html from 'remark-html'
import { Layout } from "../../shared/Layout"

interface Props {
    slug: string
    contentHtml: string
}

const MarkdownPage: NextPage<Props> = ({ slug, contentHtml }) => {
    return (
        <Layout title={`Docs - ${slug}`}>
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </Layout>
      )
}

export default MarkdownPage

const DOC_ROOT = join(__dirname, '../../../../../docs')

export async function getStaticPaths() {
    console.log(DOC_ROOT)
    const entities = await readdir(DOC_ROOT, {withFileTypes: true})
    const paths = entities
        .filter(e => e.isFile() && e.name.endsWith('.md'))
        .map(f => ({
            params: {
                slug: f.name.replace('.md', '')
            }
        }))
    return {
        paths,
        fallback: false
    };
}

export const getStaticProps: GetStaticProps<Props, {slug: string}> = async (context) => {
    console.log(context.params)
    const slug = context.params!.slug
    const fn = join(DOC_ROOT, `${slug}.md`)
    try {
        await access(fn, R_OK)
    } catch (error) {
        return {
            notFound: true
        }
    }

    const fileContents = await readFile(fn)
    const processedContent = await remark().use(html).process(fileContents)
    const contentHtml = processedContent.toString()
    return {
        props: {
            slug,
            contentHtml
        }
    }
}