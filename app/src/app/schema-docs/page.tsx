// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { buildTypeMap, resolveTypeNode } from "@lxcat/schema";
import { DocsPageClient } from "./page-client";

export default function SchemaDocsPage() {
  const typeMap = buildTypeMap();
  const initialTypeId = "LTPMixtureWithReference";
  const initialNode = resolveTypeNode(initialTypeId, typeMap);

  if (!initialNode) {
    throw new Error(`Could not resolve initial node for: ${initialTypeId}`);
  }

  return (
    <DocsPageClient
      typeMap={typeMap}
      initialTypeId={initialTypeId}
      initialNode={initialNode}
    />
  );
}

export const dynamic = "force-dynamic";
