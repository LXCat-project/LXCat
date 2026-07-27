// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getRootDocNode, buildTypeMap, resolveTypeNode, DocNode, DocTypeMap } from "@lxcat/schema";
import { LTPMixtureWithReference, NewLTPDocument, EditedLTPDocument } from "@lxcat/schema";
import { DocsPageClient } from "./page-client";

// Module-level cache: runs introspection once per server process
let cachedTypeMap: DocTypeMap | null = null;

interface RootSchema {
  id: string;
  name: string;
  label: string;
  description: string;
}

const ROOT_SCHEMAS: RootSchema[] = [
  {
    id: "LTPMixtureWithReference",
    name: "LTPMixtureWithReference",
    label: "LTPMixtureWithReference",
    description: "Main output schema for LXCat data",
  },
  {
    id: "NewLTPDocument",
    name: "NewLTPDocument",
    label: "NewLTPDocument",
    description: "Schema for new datasets",
  },
  {
    id: "EditedLTPDocument",
    name: "EditedLTPDocument",
    label: "EditedLTPDocument",
    description: "Schema for dataset updates",
  },
];

function getSchemaData(initialTypeId: string) {
  const typeMap = buildTypeMap();
  
  // Find the root schema for the initial type
  const rootSchema = ROOT_SCHEMAS.find(s => s.id === initialTypeId);
  if (!rootSchema) {
    throw new Error(`Unknown root schema: ${initialTypeId}`);
  }
  
  const rootNode = getRootDocNode(undefined, rootSchema.name);
  const initialNode = resolveTypeNode(initialTypeId, typeMap) || rootNode;

  return { typeMap, rootNode, initialNode, rootSchema };
}

export default function SchemaDocsPage() {
  // Default to LTPMixtureWithReference
  const initialTypeId = "LTPMixtureWithReference";
  const { typeMap, initialNode, rootSchema } = getSchemaData(initialTypeId);

  return (
    <DocsPageClient
      typeMap={typeMap}
      initialTypeId={initialTypeId}
      initialNode={initialNode}
      rootSchemas={ROOT_SCHEMAS}
    />
  );
}

export const dynamic = "force-dynamic";
