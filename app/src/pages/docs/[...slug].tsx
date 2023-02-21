// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GetStaticProps, NextPage } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import dynamic from "next/dynamic";

import {
  DocFile,
  extractMarkdownHeaders,
  listDocFiles,
  md2mdx,
} from "../../docs/generator";

import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
import { AppShell, Navbar } from "@mantine/core";
import { NavBar } from "../../shared/NavBar";

interface Props {
  slug: string[];
  mdxSource: MDXRemoteSerializeResult;
  docFiles: Array<DocFile>;
}

export const Mermaid = dynamic(
  () => import("../../docs/Mermaid").then((mod) => mod.Mermaid),
  { ssr: false }
);

const components = {
  Mermaid,
};

const MarkdownPage: NextPage<Props> = ({ slug, mdxSource, docFiles }) => {
  return (
    // <Layout title={`Docs - ${slug.join("/")}`}>
    <AppShell
      header={<NavBar />}
      navbar={
        <Navbar sx={{ zIndex: 10 }} p="xs" width={{ base: 300 }}>
          {docFiles.map((file) =>
            file.entries ? (
              <a href={`/docs/${file.name}`}>{file.entries[0].title}</a>
            ) : (
              <></>
            )
          )}
        </Navbar>
      }
    >
      <MDXRemote {...mdxSource} components={components} />
    </AppShell>
    // </Layout>
  );
};

export default MarkdownPage;

export async function getStaticPaths() {
  const files = await listDocFiles();
  const paths = files.map((slug) => ({
    params: {
      slug,
    },
  }));
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
    const mdxSource = await md2mdx(slug);
    const docFiles = await extractMarkdownHeaders();
    return {
      props: {
        slug,
        mdxSource,
        docFiles,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};
