// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DocsPageClient } from "./page-client";

export default async function SchemaDocsPage() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/schema-docs`,
    { cache: "force-cache" },
  );
  const rootNode = await response.json();
  return <DocsPageClient rootNode={rootNode} />;
}
