// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MDXRemote, MDXRemoteProps } from "next-mdx-remote";
import dynamic from "next/dynamic";

export const Mermaid = dynamic(
  () => import("../../../docs/Mermaid").then((mod) => mod.Mermaid),
  { ssr: false }
);

const components = {
  Mermaid,
};

export const MDXRenderer = (props: MDXRemoteProps) => (
  <MDXRemote {...props} components={components} />
);
