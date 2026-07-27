// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getRootDocNode, buildTypeMap, resolveTypeNode } from "@lxcat/schema";
import { DocsPageClient } from "./page-client";

export default function SchemaDocsPage() {
  const typeMap = buildTypeMap();
  const rootNode = getRootDocNode();
  // Default to the root type
  const initialNodeId = "VersionedLTPDocumentWithReference";
  const initialNode = resolveTypeNode(initialNodeId, typeMap) || rootNode;

  return (
    <DocsPageClient
      typeMap={typeMap}
      initialTypeId={initialNodeId}
      initialNode={initialNode}
    />
  );
}

export const dynamic = "force-static";
