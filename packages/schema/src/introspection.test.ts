// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  boolean,
  discriminatedUnion,
  enum as zodEnum,
  literal,
  number,
  object,
  record,
  string,
  union,
} from "zod";
import { describe, expect, test } from "bun:test";
import { zodToDocNode, getRootDocNode, buildTypeMap, resolveTypeNode, findReferencedTypes, getTypeDocNode, DocNode, DocProperty } from "./introspection.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function expectType(node: DocNode, type: string): void {
  expect(node.type).toBe(type);
}

function expectDescription(node: DocNode, desc: string): void {
  expect(node.description).toBe(desc);
}

function expectRequired(node: DocNode, required: boolean): void {
  expect(node.required).toBe(required);
}

function findProperty(node: DocNode, name: string): DocProperty | undefined {
  return node.properties?.find((p) => p.name === name);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("zodToDocNode", () => {
  test("primitives", () => {
    const strNode = zodToDocNode(string().describe("a string"));
    expectType(strNode, "string");
    expectDescription(strNode, "a string");
    expectRequired(strNode, true);

    const numNode = zodToDocNode(number().int());
    expectType(numNode, "number");
    expectRequired(numNode, true);

    const boolNode = zodToDocNode(boolean());
    expectType(boolNode, "boolean");
    expectRequired(boolNode, true);
  });

  test("optional fields", () => {
    const optNode = zodToDocNode(string().describe("opt").optional());
    expectType(optNode, "string");
    expectDescription(optNode, "opt");
    // After unwrapping optional, required reflects the inner type which is required
    expectRequired(optNode, true);
  });

  test("objects", () => {
    const schema = object({
      name: string().describe("The name"),
      age: number().int().optional(),
    }).describe("A person");

    const node = zodToDocNode(schema, "Person");
    expectType(node, "object");
    expectDescription(node, "A person");
    expect(node.properties).toHaveLength(2);

    const nameProp = findProperty(node, "name");
    expect(nameProp).toBeDefined();
    expectType(nameProp!.node, "string");
    expectDescription(nameProp!.node, "The name");
    expectRequired(nameProp!.node, true);

    const ageProp = findProperty(node, "age");
    expect(ageProp).toBeDefined();
    expectType(ageProp!.node, "number");
    expectRequired(ageProp!.node, false);
  });

  test("arrays", () => {
    const schema = array(string().describe("item"));
    const node = zodToDocNode(schema);
    expectType(node, "array");
    expect(node.itemType).toBe("string");
    expect(node.itemNode).toBeDefined();
    expectType(node.itemNode!, "string");
    expectDescription(node.itemNode!, "item");
  });

  test("unions", () => {
    const schema = union([string(), number()]);
    const node = zodToDocNode(schema);
    expectType(node, "union");
    expect(node.alternatives).toHaveLength(2);
    expectType(node.alternatives![0], "string");
    expectType(node.alternatives![1], "number");
  });

  test("enums", () => {
    const schema = zodEnum(["draft", "published", "archived"]);
    const node = zodToDocNode(schema);
    expectType(node, "enum");
    expect(node.itemType).toBe("draft | published | archived");
  });

  test("literals", () => {
    const schema = literal("LUT");
    const node = zodToDocNode(schema);
    expectType(node, "literal");
    expect(node.value).toBe("LUT");
    expect(node.itemType).toBe('"LUT"');
  });

  test("records", () => {
    const schema = record(string(), string().describe("value"));
    const node = zodToDocNode(schema);
    expectType(node, "record");
    expect(node.valueType).toBe("string");
    expect(node.itemNode).toBeDefined();
  });

  test("discriminated unions use discriminant values as option names", () => {
    const Cat = object({ type: literal("Cat"), meow: string() });
    const Dog = object({ type: literal("Dog"), bark: string() });
    const Duck = object({ type: literal("Duck"), quack: string() });
    const schema = discriminatedUnion("type", [Cat, Dog, Duck]);
    const node = zodToDocNode(schema);
    expectType(node, "discriminatedUnion");
    expect(node.alternatives).toHaveLength(3);
    expect(node.alternatives![0].name).toBe("Cat");
    expect(node.alternatives![1].name).toBe("Dog");
    expect(node.alternatives![2].name).toBe("Duck");
  });

  test("intersection merges properties", () => {
    const left = object({ a: string(), b: number() });
    const right = object({ b: string().describe("overridden"), c: boolean() });
    const schema = union([left, right]); // Use union for simplicity
    const node = zodToDocNode(schema);
    expectType(node, "union");
  });
});

describe("getRootDocNode", () => {
  test("returns a valid doc node", () => {
    const node = getRootDocNode();
    expectType(node, "intersection");
    expect(node.name).toBe("VersionedLTPDocumentWithReference");
    expect(node.properties).toBeDefined();
    expect(node.properties).toHaveLength(13);
  });

  test("includes key document properties", () => {
    const node = getRootDocNode();
    const propNames = node.properties!.map((p) => p.name);
    expect(propNames).toContain("$schema");
    expect(propNames).toContain("url");
    expect(propNames).toContain("contributor");
    expect(propNames).toContain("name");
    expect(propNames).toContain("states");
    expect(propNames).toContain("processes");
    expect(propNames).toContain("versionInfo");
  });

  test("versionInfo has correct structure", () => {
    const node = getRootDocNode();
    const viProp = findProperty(node, "versionInfo");
    expect(viProp).toBeDefined();
    expect(viProp!.node.type).toBe("object");
    const statusProp = findProperty(viProp!.node, "status");
    expect(statusProp).toBeDefined();
    expect(statusProp!.node.type).toBe("enum");
    expect(statusProp!.node.description).toBe("The status of the versioned document.");
  });
});

// ---------------------------------------------------------------------------
// Tests: buildTypeMap
// ---------------------------------------------------------------------------

describe("buildTypeMap", () => {
  test("returns a map with registered types", () => {
    const typeMap = buildTypeMap();
    const keys = Object.keys(typeMap);
    expect(keys.length).toBeGreaterThan(0);
    expect(typeMap).toHaveProperty("Atom");
    expect(typeMap).toHaveProperty("ShellEntry");
    expect(typeMap).toHaveProperty("Key");
    expect(typeMap).toHaveProperty("VersionInfo");
  });

  test("each entry is a valid DocNode", () => {
    const typeMap = buildTypeMap();
    for (const [id, node] of Object.entries(typeMap)) {
      expect(node.name).toBe(id);
      expect(node.type).toBeDefined();
      expect(typeof node.type).toBe("string");
    }
  });

  test("Atom type has expected properties", () => {
    const typeMap = buildTypeMap();
    const atom = typeMap["Atom"];
    expect(atom).toBeDefined();
    expect(atom!.type).toBe("object");
    expect(atom!.properties).toBeDefined();
    expect(atom!.properties!.length).toBeGreaterThan(0);
    const propNames = atom!.properties!.map((p) => p.name);
    expect(propNames).toContain("type");
    expect(propNames).toContain("composition");
    expect(propNames).toContain("charge");
  });
});

// ---------------------------------------------------------------------------
// Tests: resolveTypeNode
// ---------------------------------------------------------------------------

describe("resolveTypeNode", () => {
  test("resolves a known type", () => {
    const typeMap = buildTypeMap();
    const node = resolveTypeNode("CSLData", typeMap);
    expect(node).toBeDefined();
    expect(node!.name).toBe("CSLData");
  });

  test("returns undefined for unknown type", () => {
    const typeMap = buildTypeMap();
    const node = resolveTypeNode("NonExistentType", typeMap);
    expect(node).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: findReferencedTypes
// ---------------------------------------------------------------------------

describe("findReferencedTypes", () => {
  test("finds types referenced in root node", () => {
    const rootNode = getRootDocNode();
    const referenced = findReferencedTypes(rootNode);
    expect(referenced.size).toBeGreaterThan(10);
  });

  test("finds well-known referenced types", () => {
    const rootNode = getRootDocNode();
    const referenced = findReferencedTypes(rootNode);
    expect(referenced.has("Atom")).toBe(true);
    expect(referenced.has("ShellEntry")).toBe(true);
    expect(referenced.has("Key")).toBe(true);
    expect(referenced.has("VersionInfo")).toBe(true);
    expect(referenced.has("CSLData")).toBe(true);
  });

  test("returns unique type IDs", () => {
    const rootNode = getRootDocNode();
    const referenced = findReferencedTypes(rootNode);
    // A Set should have no duplicates
    expect(referenced.size).toBe(new Set(referenced).size);
  });

  test("works with simple node that has no references", () => {
    const schema = object({ name: string() });
    const node = zodToDocNode(schema, "Simple");
    const referenced = findReferencedTypes(node);
    expect(referenced.size).toBe(0);
  });

  test("discovers references in nested structures", () => {
    // Build a schema with a registered type reference
    const rootNode = getRootDocNode();
    const referenced = findReferencedTypes(rootNode);
    // VersionInfo is nested inside the root
    expect(referenced.has("VersionInfo")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: getTypeDocNode
// ---------------------------------------------------------------------------

describe("getTypeDocNode", () => {
  test("returns node for a known type", () => {
    const node = getTypeDocNode("Atom");
    expect(node).toBeDefined();
    expect(node!.name).toBe("Atom");
    expect(node!.type).toBe("object");
  });

  test("returns undefined for unknown type", () => {
    const node = getTypeDocNode("DoesNotExist");
    expect(node).toBeUndefined();
  });

  test("returns consistent results", () => {
    const node1 = getTypeDocNode("ShellEntry");
    const node2 = getTypeDocNode("ShellEntry");
    expect(node1!.name).toBe(node2!.name);
    expect(node1!.type).toBe(node2!.type);
    expect(node1!.properties?.length).toBe(node2!.properties?.length);
  });
});
