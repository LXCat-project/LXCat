// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "katex/dist/katex.min.css";
import { Box, BoxComponentProps } from "@mantine/core";
import katex from "katex";

// All LaTeX in the app must be rendered with the `katex` package whose
// stylesheet is imported above. KaTeX changes its CSS class names between
// versions, so HTML rendered by a different KaTeX version (e.g. one bundled in a
// third-party component) is not styled correctly.

type Delimiter = { left: string; right: string; display: boolean };

type Fragment =
  | { type: "text"; data: string }
  | { type: "math"; data: string; display: boolean };

const defaultDelimiters: ReadonlyArray<Delimiter> = [
  { left: "$$", right: "$$", display: true },
  { left: "\\(", right: "\\)", display: false },
  { left: "$", right: "$", display: false },
  { left: "\\[", right: "\\]", display: true },
];

const amsRegex = /^\\begin{/;

const escapeRegex = (text: string) =>
  text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/* Adapted from contrib/auto-render/splitAtDelimiters.js at github.com/KaTeX/KaTeX */
function findEndOfMath(delimiter: string, text: string, startIndex: number) {
  let braceLevel = 0;

  for (let index = startIndex; index < text.length; index++) {
    const character = text[index];

    if (
      braceLevel <= 0
      && text.slice(index, index + delimiter.length) === delimiter
    ) {
      return index;
    } else if (character === "\\") {
      index++;
    } else if (character === "{") {
      braceLevel++;
    } else if (character === "}") {
      braceLevel--;
    }
  }

  return -1;
}

function splitAtDelimiters(
  text: string,
  delimiters: ReadonlyArray<Delimiter>,
): Array<Fragment> {
  const fragments: Array<Fragment> = [];
  const regexLeft = new RegExp(
    `(${delimiters.map(({ left }) => escapeRegex(left)).join("|")})`,
  );

  while (true) {
    let index = text.search(regexLeft);
    if (index === -1) {
      break;
    }
    if (index > 0) {
      fragments.push({ type: "text", data: text.slice(0, index) });
      text = text.slice(index);
    }

    // `text` now starts with a left delimiter, so this always succeeds.
    const delimiter = delimiters.find(({ left }) => text.startsWith(left))!;
    index = findEndOfMath(delimiter.right, text, delimiter.left.length);
    if (index === -1) {
      break;
    }

    const rawData = text.slice(0, index + delimiter.right.length);
    fragments.push({
      type: "math",
      data: amsRegex.test(rawData)
        ? rawData
        : text.slice(delimiter.left.length, index),
      display: delimiter.display,
    });
    text = text.slice(index + delimiter.right.length);
  }

  if (text !== "") {
    fragments.push({ type: "text", data: text });
  }

  return fragments;
}

/**
 * Render a pure LaTeX math expression to an HTML string. Falls back to the
 * (escaped) source when the expression cannot be parsed.
 */
export function renderLatexAsHTMLString(latex: string, displayMode = false) {
  try {
    return katex.renderToString(latex, { displayMode });
  } catch {
    return escapeHtml(latex);
  }
}

/**
 * Render text containing LaTeX math fragments, delimited by `$...$`,
 * `$$...$$`, `\(...\)`, or `\[...\]`, to an HTML string.
 */
export const renderLatexInTextAsHTMLString = (text: string) =>
  splitAtDelimiters(text, defaultDelimiters)
    .map((fragment) =>
      fragment.type === "text"
        ? escapeHtml(fragment.data)
        : renderLatexAsHTMLString(fragment.data, fragment.display)
    )
    .join("");

export type LatexTextProps = { children: string | Array<string> };

/**
 * Text with embedded LaTeX math fragments, e.g. `"Plasma density
 * $(\\mathrm{m}^{-3})$"`.
 */
export const LatexText = ({ children }: LatexTextProps) => (
  <span
    dangerouslySetInnerHTML={{
      __html: renderLatexInTextAsHTMLString(
        Array.isArray(children) ? children.join("") : children,
      ),
    }}
  />
);

export type LatexProps = BoxComponentProps & { children: string };

/**
 * A pure LaTeX math expression, e.g. `"\\mathrm{N}_2^+"`.
 */
export const Latex = ({ children, ...props }: LatexProps) => {
  if (children === "") {
    return <></>;
  }
  return (
    <Box
      component="span"
      {...props}
      dangerouslySetInnerHTML={{ __html: renderLatexAsHTMLString(children) }}
    />
  );
};
