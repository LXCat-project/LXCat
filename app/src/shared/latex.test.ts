// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "bun:test";
import katex from "katex";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  renderLatexAsHTMLString,
  renderLatexInTextAsHTMLString,
} from "./latex";

describe("KaTeX version consistency", () => {
  // The KaTeX stylesheet only matches HTML rendered by the same KaTeX version.
  // Every package that renders LaTeX must therefore resolve to the `katex`
  // version used by the app (see the `overrides` field in the root
  // `package.json`).
  it.each(["rehype-katex"])(
    "%s uses the same KaTeX version as the app",
    (pkg) => {
      const require = createRequire(fileURLToPath(import.meta.resolve(pkg)));
      expect(require("katex/package.json").version).toBe(katex.version);
    },
  );
});

describe("renderLatexAsHTMLString", () => {
  it("renders with the app's KaTeX", () => {
    const latex = "\\mathrm{N}_2^+";
    expect(renderLatexAsHTMLString(latex)).toBe(katex.renderToString(latex));
  });

  it("falls back to escaped source on parse errors", () => {
    expect(renderLatexAsHTMLString("x^{<")).toBe("x^{&lt;");
  });
});

describe("renderLatexInTextAsHTMLString", () => {
  it("renders inline math between text", () => {
    expect(
      renderLatexInTextAsHTMLString("Plasma density $(\\mathrm{m}^{-3})$."),
    ).toBe(
      `Plasma density ${katex.renderToString("(\\mathrm{m}^{-3})")}.`,
    );
  });

  it("renders display math", () => {
    expect(renderLatexInTextAsHTMLString("$$x_1$$")).toBe(
      katex.renderToString("x_1", { displayMode: true }),
    );
  });

  it("escapes HTML in text fragments", () => {
    expect(renderLatexInTextAsHTMLString("A <b>& B</b>")).toBe(
      "A &lt;b&gt;&amp; B&lt;/b&gt;",
    );
  });

  it("leaves text with an unterminated delimiter as is", () => {
    expect(renderLatexInTextAsHTMLString("Costs $5")).toBe("Costs $5");
  });
});
