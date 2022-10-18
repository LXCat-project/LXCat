import { readdir, readFile } from "fs/promises";
import { SerializeOptions } from "next-mdx-remote/dist/types";
import { join, relative, sep } from "path";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeMathjax from "rehype-mathjax";
import rehypeSlug from "rehype-slug";
import remarkEmbedImages from "remark-embed-images";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";

import { VFile } from "vfile";

import { serialize } from "./serialize";
import { rehypeMermaid } from "./transformer";

const DOC_ROOT = join(__dirname, "../../../../../docs");

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
  const options: SerializeOptions = {
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
        rehypeMathjax,
      ],
    },
  };
  return await serialize(vfile, options);
}
