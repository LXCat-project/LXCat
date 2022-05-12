import { R_OK } from "constants"
import { access, readdir, readFile } from "fs/promises"
import { GetStaticProps, NextPage } from "next"
import { join } from "path"
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkMermaid from 'remark-mermaid-dataurl'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkToc from 'remark-toc'
import { unified } from 'unified'
import mdxMermaid from 'mdx-mermaid'
// import { Mermaid } from 'mdx-mermaid/Mermaid';
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'

import { Layout } from "../../shared/Layout"

import 'highlight.js/styles/github.css'
import { SerializeOptions } from "next-mdx-remote/dist/types"

interface Props {
    slug: string
    mdxSource: MDXRemoteSerializeResult
}

const Mermaid = (props) => {
    console.log(props)
    return (
        <pre>Chart is here</pre>
    )
}

const components = {
    Mermaid
}

const MarkdownPage: NextPage<Props> = ({ slug, mdxSource }) => {
    return (
        <Layout title={`Docs - ${slug}`}>
          <MDXRemote lazy {...mdxSource} components={components} />
        </Layout>
      )
}

export default MarkdownPage

const DOC_ROOT = join(__dirname, '../../../../../docs')

export async function getStaticPaths() {
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
    // const processedContent = await unified()
    //     .use(remarkParse)
    //     .use(remarkMermaid)
    //     .use(remarkToc)
    //     .use(remarkRehype)
    //     .use(rehypeSlug)
    //     .use(rehypeAutolinkHeadings, {behavior: 'wrap'})
    //     .use(rehypeHighlight)
    //     .use(rehypeStringify)
    //     .process(fileContents)
    // const contentHtml = processedContent.toString()
    // console.log(mdxMermaid)
    const options: SerializeOptions = {
        mdxOptions: {
            remarkPlugins:[
                // mdxMermaid,
                remarkToc,

            ],
            rehypePlugins: [
                rehypeSlug,
                [rehypeAutolinkHeadings, {behavior: 'wrap'}],
                [rehypeHighlight, {ignoreMissing: true}]
            ]
        }
    }
    const mdxSource = await serialize(fileContents.toString(), options)
    return {
        props: {
            slug,
            mdxSource
        }
    }
}