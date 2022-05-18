import { GetStaticProps, NextPage } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { Mermaid } from "../../docs/Mermaid";
import { listDocFiles, md2mdx } from "../../docs/generator";
import { Layout } from "../../shared/Layout";

import "highlight.js/styles/github.css";

interface Props {
  slug: string[];
  mdxSource: MDXRemoteSerializeResult;
}

const components = {
  Mermaid,
};

const MarkdownPage: NextPage<Props> = ({ slug, mdxSource }) => {
  return (
    <Layout title={`Docs - ${slug.join('/')}`}>
      <MDXRemote {...mdxSource} components={components} />
    </Layout>
  );
};

export default MarkdownPage;

export async function getStaticPaths() {
  const files = await listDocFiles();
  const paths = files.map(slug => ({
    params: {
      slug
    }
  }))
  return {
    paths,
    fallback: false,
  };
}

export const getStaticProps: GetStaticProps<Props, { slug: string[] }> = async (
  context
) => {
  const slug = context.params!.slug;
  try {
    const mdxSource = await md2mdx(slug)
    return {
      props: {
        slug,
        mdxSource,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};
