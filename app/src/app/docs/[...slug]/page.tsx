// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { listDocFiles, md2mdx } from "../../../docs/generator";
import { MDXRenderer } from "./mdx-renderer";

import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";

interface PageProps<ParamType> {
  params: Promise<ParamType>;
}

const Page = async ({
  params,
}: PageProps<{ slug: Array<string> }>) => {
  const { slug } = await params;
  const mdxSource = await md2mdx(slug);
  return <MDXRenderer {...mdxSource} />;
};

export default Page;

export async function generateStaticParams() {
  const files = await listDocFiles();
  return files.map((slug) => ({
    slug,
  }));
}
