// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MDXRemote, MDXRemoteProps } from "next-mdx-remote";
import dynamic from "next/dynamic";
import type { MermaidProps } from "../../../docs/Mermaid";

// FIXME: Why do we need this explicit cast?
const Mermaid = dynamic(
  () => import("../../../docs/Mermaid").then((mod) => mod.Mermaid),
  { ssr: false },
) as (props: MermaidProps) => JSX.Element;

const components = {
  Mermaid,
};

export const MDXRenderer = (props: MDXRemoteProps) => (
  <MDXRemote {...props} components={components} />
);
