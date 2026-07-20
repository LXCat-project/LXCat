// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from "@mantine/code-highlight";
import hljs from "highlight.js";
import jsonLang from "highlight.js/lib/languages/json";

hljs.registerLanguage("json", jsonLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

export const CodeHighlightProvider = (
  { children }: { children: React.ReactNode },
) => (
  <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
    {children}
  </CodeHighlightAdapterProvider>
);
