import { R_OK } from "constants";
import { access, readdir, readFile } from "fs/promises";
import { GetStaticProps, NextPage } from "next";
import { join } from "path";
import remarkEmbedImages from 'remark-embed-images'
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkToc from 'remark-toc';
import remarkMath from 'remark-math'
import rehypeMathjax from 'rehype-mathjax'
import { serialize } from "next-mdx-remote/serialize";
import { SerializeOptions } from "next-mdx-remote/dist/types";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { Mermaid } from "../../docs/Mermaid";
import { rehypeMermaid } from "../../docs/transformer";
import { Layout } from "../../shared/Layout";

import "highlight.js/styles/github.css";

interface Props {
  slug: string;
  mdxSource: MDXRemoteSerializeResult;
}

const components = {
  Mermaid,
};

const MarkdownPage: NextPage<Props> = ({ slug, mdxSource }) => {
  return (
    <Layout title={`Docs - ${slug}`}>
      <MDXRemote {...mdxSource} components={components} />
    </Layout>
  );
};

export default MarkdownPage;

const DOC_ROOT = join(__dirname, "../../../../../docs");

export async function getStaticPaths() {
  const entities = await readdir(DOC_ROOT, { withFileTypes: true });
  const paths = entities
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((f) => ({
      params: {
        slug: f.name.replace(".md", ""),
      },
    }));
  return {
    paths,
    fallback: false,
  };
}

export const getStaticProps: GetStaticProps<Props, { slug: string }> = async (
  context
) => {
  const slug = context.params!.slug;
  const fn = join(DOC_ROOT, `${slug}.md`);
  try {
    await access(fn, R_OK);
  } catch (error) {
    return {
      notFound: true,
    };
  }

  const fileContents = await readFile(fn);
  const options: SerializeOptions = {
    mdxOptions: {
      remarkPlugins: [
          remarkToc,
          // TODO make image links resolve relative to md file instead of app/
          // As workaround use ../docs/bla.png as img src.
          remarkEmbedImages,
          remarkMath,
      ],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
        [rehypeHighlight, { ignoreMissing: true }],
        rehypeMermaid,
        rehypeMathjax,
      ]
    }
  };
  const mdxSource = await serialize(fileContents.toString(), options);
  return {
    props: {
      slug,
      mdxSource,
    },
  };
};
