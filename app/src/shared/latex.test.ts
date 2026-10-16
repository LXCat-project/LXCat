// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "bun:test";
import katex from "katex";
import {
  renderLatexAsHTMLString,
  renderLatexInTextAsHTMLString,
} from "./latex";

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
