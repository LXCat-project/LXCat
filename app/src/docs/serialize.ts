import type {
  MDXRemoteSerializeResult,
  SerializeOptions,
} from "next-mdx-remote/dist/types";
import { remove } from "unist-util-remove";
import { Plugin } from "unified";

import { compile, CompileOptions } from "@mdx-js/mdx";
import { VFile } from "vfile";
import { matter } from "vfile-matter";

/*
 * The next-mdx-remote serialize() uses process.cwd() as cwd, while to have links to images you need mdfile.dirname as cwd.
 *
 * Below is a copy of https://github.com/hashicorp/next-mdx-remote/blob/main/dist/serialize.ts#L34
 * with a vfile as argument instead of a markdown string for serialize()
 */

/**
 * remark plugin which removes all import and export statements
 */
export function removeImportsExportsPlugin(): Plugin {
  return (tree) => remove(tree, "mdxjsEsm");
}

function getCompileOptions(
  mdxOptions: SerializeOptions["mdxOptions"] = {}
): CompileOptions {
  const areImportsEnabled = mdxOptions?.useDynamicImport;

  // don't modify the original object when adding our own plugin
  // this allows code to reuse the same options object
  const remarkPlugins = [
    ...(mdxOptions.remarkPlugins || []),
    ...(areImportsEnabled ? [] : [removeImportsExportsPlugin]),
  ];

  return {
    ...mdxOptions,
    remarkPlugins,
    outputFormat: "function-body",
    providerImportSource: "@mdx-js/react",
  };
}

/**
 * Parses and compiles the provided MDX string. Returns a result which can be passed into <MDXRemote /> to be rendered.
 */
export async function serialize(
  vfile: VFile,
  {
    scope = {},
    mdxOptions = {},
    parseFrontmatter = false,
  }: SerializeOptions = {}
): Promise<MDXRemoteSerializeResult> {
  // makes frontmatter available via vfile.data.matter
  if (parseFrontmatter) {
    matter(vfile, { strip: true });
  }

  let compiledMdx: VFile;

  compiledMdx = await compile(vfile, getCompileOptions(mdxOptions));

  let compiledSource = String(compiledMdx);

  return {
    compiledSource,
    frontmatter:
      (vfile.data.matter as Record<string, string> | undefined) ?? {},
    scope,
  };
}
