import { readdir, readFile } from "fs/promises";
import { join } from "path";
import remarkEmbedImages from "remark-embed-images";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkToc from "remark-toc";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { serialize } from "next-mdx-remote/serialize";
import { SerializeOptions } from "next-mdx-remote/dist/types";
import { rehypeMermaid } from "./transformer";

const DOC_ROOT = join(__dirname, "../../../../docs");

export async function listDocFiles() {
  const entities = await readdir(DOC_ROOT, { withFileTypes: true });
  const paths = entities
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((f) => ({
      params: {
        slug: f.name.replace(".md", ""),
      },
    }));
  return paths;
}

export async function md2mdx(slug: string) {
  const fn = join(DOC_ROOT, `${slug}.md`);
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
      ],
    },
  };
  return await serialize(fileContents.toString(), options);
}
