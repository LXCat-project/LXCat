// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Anchor, Title, TitleOrder } from "@mantine/core";
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote";
import dynamic from "next/dynamic";
import Link from "next/link";
import { JSX } from "react";
import type { MermaidProps } from "../../../docs/mermaid";

// FIXME: Why do we need this explicit cast?
const Mermaid = dynamic(
  () => import("../../../docs/mermaid").then((mod) => mod.Mermaid),
  { ssr: false },
) as (props: MermaidProps) => JSX.Element;

const components = {
  Mermaid,
  a: (props: any) => <Anchor component={Link} {...props} />,
  h1: (props: any) => renderTitle(1, props),
  h2: (props: any) => renderTitle(2, props),
  h3: (props: any) => renderTitle(3, props),
};

const renderTitle = (order: TitleOrder, props: any) => {
  if (props.children.type.name === "a") {
    return (
      <Title order={order}>
        <a {...props.children.props} />
      </Title>
    );
  }

  return <Title order={order} {...props} />;
};

export const MDXRenderer = (props: MDXRemoteProps) => (
  <MDXRemote {...props} components={components} />
);
