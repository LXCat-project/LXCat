// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getRootDocNode } from "@lxcat/schema";
import { DocsPageClient } from "./page-client";

export default function SchemaDocsPage() {
  const rootNode = getRootDocNode();
  return <DocsPageClient rootNode={rootNode} />;
}

export const dynamic = "force-static";
