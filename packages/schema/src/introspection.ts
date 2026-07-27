// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  ZodType,
  globalRegistry,
} from "zod";
import {
  EditedLTPDocument,
  NewLTPDocument,
  VersionedLTPDocumentWithReference,
  LTPMixtureWithReference,
} from "./index.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DocNode {
  name: string;
  type: string; // "string", "number", "object", "array<T>", "union", "tuple",
                // "record<K,V>", "intersection", "enum", "literal"
  description?: string;
  required: boolean;
  properties?: DocProperty[];
  alternatives?: DocNode[];
  itemType?: string; // for arrays/tuples: the type string of items
  itemNode?: DocNode; // for arrays/tuples: full child node
  value?: unknown; // for literals
  valueType?: string; // for records
  registeredId?: string;
}

export interface DocProperty {
  name: string;
  node: DocNode;
}

export interface DocTypeMap {
  [id: string]: DocNode;
}

// ---------------------------------------------------------------------------
// Helpers — zod v4 def types are opaque, so we cast to a workable shape
// ---------------------------------------------------------------------------

// Zod v4 has opaque def types — we go through unknown to access fields.
type ZodDefAny = Record<string, unknown>;
type ZodTypeAny = ZodType;

/** Safely cast zod.def to our workable shape */
const toDef = (z: ZodTypeAny): ZodDefAny => (z.def as unknown) as ZodDefAny;

/** Build a human-readable type string from a DocNode */
function nodeTypeString(node: DocNode): string {
  if (node.type === "array" && node.itemType) return `array<${node.itemType}>`;
  if (node.type === "record" && node.valueType) return `record<string, ${node.valueType}>`;
  return node.type;
}

/** Recursively unwrap optional types */
function unwrapOptional(zod: ZodTypeAny): ZodTypeAny {
  const def = toDef(zod);
  if (def.type === "optional") return unwrapOptional((def.innerType as unknown) as ZodTypeAny);
  return zod;
}

/** Unwrap optional and return [unwrapped, depth] */
function unwrapOptionalDepth(zod: ZodTypeAny): { unwrapped: ZodTypeAny; depth: number } {
  const def = toDef(zod);
  if (def.type === "optional") {
    const inner = unwrapOptionalDepth((def.innerType as unknown) as ZodTypeAny);
    return { unwrapped: inner.unwrapped, depth: inner.depth + 1 };
  }
  return { unwrapped: zod, depth: 0 };
}

// ---------------------------------------------------------------------------
// Core: convert a ZodType to a DocNode
// ---------------------------------------------------------------------------

export function zodToDocNode(
  zod: ZodTypeAny,
  name: string = "",
  required: boolean = true,
): DocNode {
  const base = unwrapOptionalDepth(zod);
  const unwrapped = base.unwrapped;
  // Description is stored on the inner type, not on the optional wrapper
  const description = unwrapped.description ?? "";
  const def = toDef(unwrapped);

  // Check if this type is registered in the global registry
  // Map structure is { id: string } → ZodType, so we need to find the entry where value matches
  const idMap = globalRegistry._idmap as Map<string, ZodTypeAny>;
  let registeredId: string | undefined;
  for (const [id, zodType] of idMap) {
    if (zodType === unwrapped) {
      registeredId = id;
      break;
    }
  }

  switch (def.type) {
    case "string":
    case "number":
    case "boolean": {
      return {
        name,
        type: def.type as string,
        description: description || undefined,
        required,
        registeredId: registeredId || undefined,
      };
    }

    case "enum": {
      // zod v4 stores enum values as entries {key: value} not an array
      const entries = def.entries as Record<string, string>;
      const typeStr = entries ? Object.keys(entries).join(" | ") : "unknown";
      return {
        name,
        type: "enum",
        description: description || undefined,
        required,
        itemType: typeStr,
        registeredId: registeredId || undefined,
      };
    }

    case "lazy": {
      // Lazy types are used for recursive references.
      // We can't resolve them without calling the getter, which could cause
      // infinite recursion. Return a placeholder node.
      return {
        name,
        type: "lazy",
        description: description || undefined,
        required,
      };
    }

    case "literal": {
      const values = def.values as unknown[];
      const typeStr = values.map(v => `"${v}"`).join(" | ");
      return {
        name,
        type: "literal",
        description: description || undefined,
        required,
        value: values[0],
        itemType: typeStr,
      };
    }

    case "object": {
      const shape = (def.shape as unknown) as Record<string, ZodTypeAny> | undefined;
      if (!shape) {
        return { name, type: "object", description: description || undefined, required };
      }

      const properties: DocProperty[] = Object.entries(shape).map(([key, val]) => {
        const isOpt = toDef(val).type === "optional";
        const child = zodToDocNode(
          isOpt ? unwrapOptional(val) : val,
          key,
          !isOpt,
        );
        return { name: key, node: child };
      });

      return {
        name,
        type: "object",
        description: description || undefined,
        required,
        properties,
        registeredId: registeredId || undefined,
      };
    }

    case "array": {
      // zod v4 stores array element in def.element, not def.innerType
      const inner = (def.element as unknown) as ZodTypeAny;
      const innerNode = zodToDocNode(inner, "", true);
      return {
        name,
        type: "array",
        description: description || undefined,
        required,
        itemType: nodeTypeString(innerNode),
        itemNode: innerNode,
      };
    }

    case "tuple": {
      const items = (def.items as unknown) as ZodTypeAny[];
      const alternatives = items.map((item, i) =>
        zodToDocNode(item, `[${i}]`, true)
      );
      return {
        name,
        type: "tuple",
        description: description || undefined,
        required,
        alternatives,
      };
    }

    case "union": {
      const options = (def.options as unknown) as ZodTypeAny[];

      // Check if this is a discriminated union
      const discriminator = (def.discriminator as unknown) as string | undefined;
      if (discriminator) {
        // Extract discriminant values from each option's discriminator field
        const alternatives = options.map((opt, i) => {
          // Try to get the literal discriminant value
          const optDef = toDef(opt);
          const shape = (optDef.shape as unknown) as Record<string, ZodTypeAny> | undefined;
          const discField = shape?.[discriminator];
          let optName = `Option ${i + 1}`;
          if (discField) {
            const discDef = toDef(discField);
            if (discDef.type === "literal" && Array.isArray(discDef.values)) {
              optName = discDef.values[0] as string;
            }
          }
          return zodToDocNode(opt, optName, true);
        });
        return {
          name,
          type: "discriminatedUnion",
          description: description || undefined,
          required,
          alternatives,
        };
      }

      // Regular union
      const alternatives = options.map((opt) =>
        zodToDocNode(opt, "", true)
      );
      return {
        name,
        type: "union",
        description: description || undefined,
        required,
        alternatives,
      };
    }

    case "record": {
      const valueType = (def.valueType as unknown) as ZodTypeAny;
      const valueNode = zodToDocNode(valueType, "", true);
      return {
        name,
        type: "record",
        description: description || undefined,
        required,
        valueType: nodeTypeString(valueNode),
        itemNode: valueNode,
      };
    }

    case "intersection": {
      const left = (def.left as unknown) as ZodTypeAny;
      const right = (def.right as unknown) as ZodTypeAny;
      const leftNode = zodToDocNode(left, "", true);
      const rightNode = zodToDocNode(right, "", true);

      // Merge properties from both sides (right overrides left on collision)
      const allProperties: DocProperty[] = [];
      const propertyNames = new Set<string>();

      if (leftNode.properties) {
        for (const p of leftNode.properties) {
          allProperties.push(p);
          propertyNames.add(p.name);
        }
      }
      if (rightNode.properties) {
        for (const p of rightNode.properties) {
          if (!propertyNames.has(p.name)) {
            allProperties.push(p);
            propertyNames.add(p.name);
          } else {
            const idx = allProperties.findIndex(pp => pp.name === p.name);
            if (idx !== -1) allProperties[idx] = p;
          }
        }
      }

      return {
        name,
        type: "intersection",
        description: description || undefined,
        required,
        properties: allProperties,
      };
    }

    default: {
      // For any unknown type (e.g. "transform"), return a minimal node
      return {
        name,
        type: def.type as string,
        description: description || undefined,
        required,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Build a map of all registered types
// ---------------------------------------------------------------------------

export function buildTypeMap(): DocTypeMap {
  const map: DocTypeMap = {};
  const idMap = globalRegistry._idmap as unknown as Map<string, ZodTypeAny>;
  for (const [id, zodType] of idMap) {
    // Skip non-ZodType entries (e.g. functions, primitives)
    if (typeof zodType !== "object" || zodType === null || !("def" in zodType)) {
      continue;
    }
    try {
      map[id] = zodToDocNode(zodType, id, true);
    } catch {
      // Skip types that can't be introspected
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Resolve a type by its registered ID
// ---------------------------------------------------------------------------

/**
 * Look up a type by its registered ID and return its DocNode.
 * Returns undefined if the type is not found in the map.
 */
export function resolveTypeNode(typeId: string, typeMap: DocTypeMap): DocNode | undefined {
  return typeMap[typeId];
}

// ---------------------------------------------------------------------------
// Discover all types referenced by a root node
// ---------------------------------------------------------------------------

/**
 * Recursively traverse a DocNode tree and collect all registered type IDs.
 * Returns a Set of unique type IDs referenced anywhere in the tree.
 */
export function findReferencedTypes(node: DocNode, typeMap: DocTypeMap = buildTypeMap()): Set<string> {
  const ids = new Set<string>();

  function traverse(n: DocNode) {
    if (n.registeredId) {
      ids.add(n.registeredId);
    }
    if (n.properties) {
      for (const p of n.properties) {
        traverse(p.node);
      }
    }
    if (n.itemNode) {
      traverse(n.itemNode);
    }
    if (n.alternatives) {
      for (const alt of n.alternatives) {
        traverse(alt);
      }
    }
  }

  traverse(node);
  return ids;
}

// ---------------------------------------------------------------------------
// Schema ID to ZodType mapping
// ---------------------------------------------------------------------------

const ROOT_SCHEMA_MAP: Record<string, ZodType> = {
  "LTPMixtureWithReference": LTPMixtureWithReference as unknown as ZodType,
  "NewLTPDocument": NewLTPDocument as unknown as ZodType,
  "EditedLTPDocument": EditedLTPDocument as unknown as ZodType,
  "VersionedLTPDocumentWithReference": VersionedLTPDocumentWithReference as unknown as ZodType,
};

/**
 * Look up a root schema by its ID.
 * Returns the schema if found, undefined otherwise.
 */
export function getRootSchemaById(id: string): ZodType | undefined {
  return ROOT_SCHEMA_MAP[id];
}

// ---------------------------------------------------------------------------
// Root type for the main document schema
// ---------------------------------------------------------------------------

/**
 * Build a DocNode tree from a root Zod schema.
 * If `schema` is a string, it is treated as a schema ID and looked up.
 * Defaults to VersionedLTPDocumentWithReference if no schema or ID is provided.
 */
export function getRootDocNode(schema?: ZodTypeAny | string, name?: string): DocNode {
  let rootSchema: ZodTypeAny;
  let rootName: string;

  if (typeof schema === "string") {
    // Schema is provided as an ID string - look it up
    const resolved = ROOT_SCHEMA_MAP[schema];
    if (resolved) {
      rootSchema = resolved;
      rootName = name ?? schema;
    } else {
      rootSchema = VersionedLTPDocumentWithReference;
      rootName = name ?? "VersionedLTPDocumentWithReference";
    }
  } else if (schema) {
    // Schema is a ZodType
    rootSchema = schema;
    rootName = name ?? "VersionedLTPDocumentWithReference";
  } else {
    // No schema provided - use default
    rootSchema = VersionedLTPDocumentWithReference;
    rootName = name ?? "VersionedLTPDocumentWithReference";
  }

  return zodToDocNode(rootSchema, rootName, true);
}

/**
 * Get the DocNode for a specific registered type.
 * Convenience wrapper around resolveTypeNode with a fresh typeMap.
 */
export function getTypeDocNode(typeId: string): DocNode | undefined {
  const typeMap = buildTypeMap();
  return resolveTypeNode(typeId, typeMap);
}
