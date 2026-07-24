// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  ZodType,
  globalRegistry,
} from "zod";
import {
  VersionedLTPDocumentWithReference,
} from "./versioned-document.js";

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
  const registeredMeta = (globalRegistry._idmap as Map<unknown, unknown>).get(unwrapped);
  const registeredId = registeredMeta ? ((registeredMeta as { id: string }).id) : undefined;

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

    case "discriminatedUnion": {
      const options = (def.options as unknown) as ZodTypeAny[];
      const alternatives = options.map((opt) =>
        zodToDocNode(opt, "", true)
      );
      return {
        name,
        type: "discriminatedUnion",
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
  const idMap = globalRegistry._idmap as unknown as Map<string, { id: string }>;
  for (const [type, meta] of idMap) {
    // Skip non-ZodType entries (e.g. functions, primitives)
    const zodType = type as unknown;
    if (typeof zodType !== "object" || zodType === null || !("def" in zodType)) {
      continue;
    }
    try {
      map[meta.id] = zodToDocNode(zodType as ZodTypeAny, meta.id, true);
    } catch {
      // Skip types that can't be introspected
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Root type for the main document schema
// ---------------------------------------------------------------------------

export function getRootDocNode(): DocNode {
  return zodToDocNode(
    VersionedLTPDocumentWithReference as ZodTypeAny,
    "VersionedLTPDocumentWithReference",
    true,
  );
}
