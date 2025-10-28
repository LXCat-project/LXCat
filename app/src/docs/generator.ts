// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readdir, readFile } from "fs/promises";
import { Heading } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { serialize } from "next-mdx-remote/serialize";
import { join, relative, sep } from "path";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkEmbedImages from "remark-embed-images";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import { VFile } from "vfile";
import { rehypeMermaid } from "./transformer";

const DOC_ROOT = "../docs"; // join(__dirname, "../../../docs");

export async function listDocFiles(dir = DOC_ROOT) {
  const files = await readdir(dir, { withFileTypes: true });
  let paths: string[][] = [];
  for (const file of files) {
    if (file.isFile() && file.name.endsWith(".md")) {
      const fn = file.name.replace(".md", "");
      const rdir = relative(DOC_ROOT, dir);
      const subdirs = rdir ? rdir.split(sep) : [];
      paths.push([...subdirs, fn]);
    }
    if (file.isDirectory()) {
      const subdir = join(dir, file.name);
      const subpaths = await listDocFiles(subdir);
      paths = paths.concat(subpaths);
    }
  }
  return paths;
}

export async function md2mdx(slug: string[]) {
  const basename = slug.pop();
  const dirname = join(DOC_ROOT, ...slug);
  const fn = `${basename}.md`;
  const path = join(dirname, fn);
  const fileContents = await readFile(path);
  const vfile = new VFile({
    value: fileContents,
    path: fn,
    cwd: dirname,
  });
  return await serialize(
    vfile,
    {
      mdxOptions: {
        remarkPlugins: [
          remarkToc,
          // TODO make image links resolve relative to md file instead of app/
          // As workaround use ../docs/bla.png as img src.
          remarkEmbedImages,
          remarkMath,
          remarkGfm,
        ],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          [rehypeHighlight, { ignoreMissing: true }],
          rehypeMermaid,
          rehypeKatex,
        ],
      },
    },
  );
}

interface FlatDocFile {
  name: string;
  entries: Array<DocHeader>;
}

interface DocHeader {
  depth: number;
  title: string;
}

export interface DocFile {
  name: string;
  entries?: Array<DocSection>;
}

export interface DocSection {
  title: string;
  children?: Array<DocSection>;
}

const makeNestedDocFile = (file: FlatDocFile): DocFile => ({
  name: file.name,
  entries: makeNestedEntries(file.entries, 0, 0)[0],
});

const makeNestedEntries = (
  entries: Array<DocHeader>,
  index: number,
  depth: number,
): [Array<DocSection>, number] => {
  let children = [];

  while (true) {
    if (index >= entries.length) break;

    const current = entries[index];

    if (current.depth <= depth) {
      break;
    } else {
      const result = makeNestedEntries(entries, index + 1, current.depth);

      result[0].length === 0
        ? children.push({
          title: current.title,
        })
        : children.push({
          title: current.title,
          children: result[0],
        });
      index = result[1];
    }
  }

  return [children, index];
};

const extractHeadingValue = (content: Heading["children"][0]): string => {
  switch (content.type) {
    case "text":
      return content.value;
    case "emphasis":
    case "strong":
      return content.children
        .map((child) => extractHeadingValue(child))
        .join("");
    default:
      throw new Error(
        `Unknown syntax node in markdown heading:\n${
          JSON.stringify(
            content,
            null,
            2,
          )
        }`,
      );
  }
};

// TODO: Introduce a system for ordering the documentation pages, e.g. enforce all documentation markdown files to start with a number to indicate their order.
export const extractMarkdownHeaders = async () => {
  const files = await readdir(DOC_ROOT).then((files) =>
    files.filter((file) => file.endsWith(".md"))
  );

  return await Promise.all(
    files.map(async (file): Promise<DocFile> => {
      const content = await readFile(join(DOC_ROOT, file), {
        encoding: "utf8",
      });

      const tree = fromMarkdown(content);

      const entries = tree.children
        .filter((child): child is Heading => child.type === "heading")
        .map(
          (heading): DocHeader => ({
            title: heading.children
              .map((child) => extractHeadingValue(child))
              .join(""),
            depth: heading.depth,
          }),
        );

      return makeNestedDocFile({ name: file.slice(0, -3), entries });
    }),
  );
};
