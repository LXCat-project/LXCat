// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "bun:test";
import katex from "katex";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Latex, LatexText } from "./latex";

describe("Latex", () => {
  it("renders with the app's KaTeX", () => {
    const latex = "\\mathrm{N}_2^+";
    expect(renderToStaticMarkup(createElement(Latex, null, latex))).toBe(
      `<span>${katex.renderToString(latex)}</span>`,
    );
  });

  it.each(["", undefined as unknown as string])(
    "renders %p as nothing",
    (latex) => {
      expect(renderToStaticMarkup(createElement(Latex, null, latex))).toBe("");
    },
  );

  it("shows invalid LaTeX as a KaTeX error", () => {
    expect(renderToStaticMarkup(createElement(Latex, null, "x^{"))).toContain(
      "katex-error",
    );
  });
});

describe("LatexText", () => {
  const render = (text: string) =>
    renderToStaticMarkup(createElement(LatexText, null, text));

  it("renders inline math between text", () => {
    expect(render("Plasma density $(\\mathrm{m}^{-3})$.")).toBe(
      `<span>Plasma density <span>${
        katex.renderToString("(\\mathrm{m}^{-3})")
      }</span>.</span>`,
    );
  });

  it("renders display math", () => {
    expect(render("$$x_1$$")).toBe(
      `<span><span>${
        katex.renderToString("x_1", { displayMode: true })
      }</span></span>`,
    );
  });

  it("escapes HTML in text", () => {
    expect(render("A <b>& B</b>")).toBe(
      "<span>A &lt;b&gt;&amp; B&lt;/b&gt;</span>",
    );
  });

  it("leaves text with an unterminated delimiter as is", () => {
    expect(render("Costs $5")).toBe("<span>Costs $5</span>");
  });
});
