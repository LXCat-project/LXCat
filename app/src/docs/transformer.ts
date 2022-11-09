// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Node } from "unist";
import { visit, SKIP } from "unist-util-visit";

/**
 *
 * Converts
 * <pre>
 * ```mermaid
 * graph TD;
 *   A-->B;
 *   A-->C;
 *   B-->D;
 *   C-->D;
 * ```
 * </pre>
 *
 * to
 * <pre>
 * <Mermaid chart={`graph TD;
 *   A-->B;
 *   A-->C;
 *   B-->D;
 *   C-->D;`} />
 *   </pre>
 *
 * Similar to https://github.com/sjwall/mdx-mermaid, but using latest mermaid version
 */
export function rehypeMermaid() {
  return (tree: Node) => {
    visit(
      tree,
      { type: "element", tagName: "code" },
      (node: any, index, parent: any) => {
        if (
          node.properties?.className?.some(
            (d: string) => d === "language-mermaid"
          )
        ) {
          const chart = node.children[0].value;
          const newNode = {
            type: "mdxJsxFlowElement",
            name: "Mermaid",
            attributes: [
              { type: "mdxJsxAttribute", name: "chart", value: chart },
            ],
            children: [],
            data: { _mdxExplicitJsx: true },
          };
          parent.children.splice(index, 1, newNode);
          return [SKIP, index];
        }
      }
    );
  };
}
