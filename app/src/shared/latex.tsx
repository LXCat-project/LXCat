// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "katex/dist/katex.min.css";
import katex from "katex";
import splitAtDelimiters, {
  type DelimiterSpec,
} from "katex/contrib/auto-render/splitAtDelimiters.ts";

// All LaTeX in the app must be rendered with the `katex` package whose
// stylesheet is imported above. KaTeX changes its CSS class names between
// versions, so HTML rendered by a different KaTeX version (e.g. one bundled in a
// third-party component) is not styled correctly.

export type LatexProps = {
  children: string;
  className?: string;
  displayMode?: boolean;
};

/**
 * A pure LaTeX math expression, e.g. `"\\mathrm{N}_2^+"`.
 */
export const Latex = (
  { children, className, displayMode = false }: LatexProps,
) => {
  if (!children) {
    return null;
  }
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(children, {
          displayMode,
          throwOnError: false,
        }),
      }}
    />
  );
};

// The default delimiters of KaTeX's auto-render without the AMS environments,
// plus `$...$`.
const delimiters: Array<DelimiterSpec> = [
  { left: "$$", right: "$$", display: true },
  { left: "\\(", right: "\\)", display: false },
  { left: "$", right: "$", display: false },
  { left: "\\[", right: "\\]", display: true },
];

/**
 * Text with embedded LaTeX math fragments, delimited by `$...$`, `$$...$$`,
 * `\(...\)`, or `\[...\]`, e.g. `"Plasma density $(\\mathrm{m}^{-3})$"`.
 */
export const LatexText = ({ children }: { children: string }) => (
  <span>
    {splitAtDelimiters(children, delimiters).map((fragment, index) =>
      fragment.type === "text"
        ? fragment.data
        : (
          <Latex key={index} displayMode={fragment.display}>
            {fragment.data}
          </Latex>
        )
    )}
  </span>
);
