// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare module "remark-mermaid-dataurl" {
  export default function remarkMermaid(
    settings?: void | Options | undefined
  ): void;
  export type Options = {
    // Options to pass to mermaid-cli
    mermaidCli?: any;
  };
}

declare module "mermaid";
