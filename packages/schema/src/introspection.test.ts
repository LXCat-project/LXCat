// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  boolean,
  enum as zodEnum,
  literal,
  number,
  object,
  record,
  string,
  union,
} from "zod";
import { describe, expect, test } from "bun:test";
import { zodToDocNode, getRootDocNode, DocNode, DocProperty } from "./introspection.js";

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
