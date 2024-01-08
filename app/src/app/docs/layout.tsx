// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extractMarkdownHeaders } from "../../docs/generator";
import { MarkdownLayout } from "./markdown-layout";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const docFiles = await extractMarkdownHeaders();

  return <MarkdownLayout docFiles={docFiles}>{children}</MarkdownLayout>;
};

export default Layout;
