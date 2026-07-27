// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getRootDocNode, buildTypeMap, resolveTypeNode, DocNode, DocTypeMap } from "@lxcat/schema";
import { LTPMixtureWithReference } from "@lxcat/schema";
import { DocsPageClient } from "./page-client";

// Module-level cache: runs introspection once per server process
let cachedTypeMap: DocTypeMap | null = null;
let cachedRootNode: DocNode | null = null;

function getSchemaData() {
  if (cachedTypeMap && cachedRootNode) {
    return { typeMap: cachedTypeMap, rootNode: cachedRootNode };
  }
  
  cachedTypeMap = buildTypeMap();
  // Use LTPMixtureWithReference as the root type for the schema viewer
  cachedRootNode = getRootDocNode(LTPMixtureWithReference, "LTPMixtureWithReference");
  
  return { typeMap: cachedTypeMap, rootNode: cachedRootNode };
}

export default function SchemaDocsPage() {
  const { typeMap, rootNode } = getSchemaData();
  // Default to the root type
  const initialNodeId = "LTPMixtureWithReference";
  const initialNode = resolveTypeNode(initialNodeId, typeMap) || rootNode;

  return (
    <DocsPageClient
      typeMap={typeMap}
      initialTypeId={initialNodeId}
      initialNode={initialNode}
    />
  );
}

export const dynamic = "force-dynamic";
