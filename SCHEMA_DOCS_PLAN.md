# Schema Documentation Viewer — Implementation Plan

## Overview

Build an interactive schema documentation viewer in `@lxcat/app` that renders the zod schema definitions from `@lxcat/schema` in a clickable, hierarchical format. Users can click through properties and see descriptions clearly displayed.

**Entry type:** `VersionedLTPDocumentWithReference` — the schema used for datasets downloaded from LXCat.

---

## Status: Phase 1 Complete

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Introspection Utility | ✅ Done | `packages/schema/src/introspection.ts` |
| 2. Server-Side API Route | ⏳ Next | `app/src/app/api/schema-docs/route.ts` |
| 3. Client Components | ⏳ Pending | Schema tree, detail card, search |
| 4. Page Integration | ⏳ Pending | `/schema-docs` page + navbar |
| 5. Polish & Enhancements | ⏳ Pending | Icons, cross-references, JSON preview |

---

## Phase 1: Schema Introspection Utility

**Location:** `packages/schema/src/introspection.ts`

### Public API

```ts
interface DocNode {
  name: string;           // Property name or type name
  type: string;           // "string", "number", "object", "array<T>", "union", "record<K,V>", "enum", "literal", "tuple", "intersection", "lazy"
  description?: string;
  required: boolean;
  properties?: DocProperty[];       // For objects
  alternatives?: DocNode[];          // For unions/tuples
  itemType?: string;                 // For arrays/tuples/records: inner type string
  itemNode?: DocNode;                // For arrays/tuples/records: full child node
  value?: unknown;                   // For literals
  valueType?: string;                // For records
  registeredId?: string;             // If type is globally registered
}

interface DocProperty {
  name: string;
  node: DocNode;
}

interface DocTypeMap {
  [id: string]: DocNode;
}
```

### Functions

| Function | Description |
|----------|-------------|
| `zodToDocNode(zod, name?, required?)` | Recursively convert any zod type to a `DocNode` |
| `getRootDocNode()` | Get the root node for `VersionedLTPDocumentWithReference` |
| `buildTypeMap()` | Build a map of all globally registered types |

### Zod v4 Specifics Handled

- **Arrays:** `def.element` (not `def.innerType`)
- **Enums:** Values stored as `entries` record (not array)
- **Descriptons:** On the unwrapped inner type (optional wrapper has no description)
- **Lazys:** Return placeholder nodes to avoid infinite recursion
- **Intersections:** Merge properties from both sides (right overrides left on collision)

### Branch

```
schema-docs
├── 3229fc94 feat(schema): add introspection utility for zod schemas
└── 1e0c84d5 feat(schema): export introspection types and functions
```

---

## Phase 2: Server-Side API Route

**Location:** `app/src/app/api/schema-docs/route.ts`

### Goal

Serve the introspected schema as JSON to the client.

### Implementation

```ts
// app/src/app/api/schema-docs/route.ts
import { NextResponse } from "next/server";
import { getRootDocNode } from "@lxcat/schema";

export const dynamic = "force-static"; // Schema never changes at runtime

export async function GET() {
  const rootNode = getRootDocNode();
  return NextResponse.json(rootNode, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
```

### Why a route instead of server-rendered page?

- Separates concerns: server builds data, client handles interaction
- Enables incremental loading (show placeholder while fetching)
- Makes it easy to add filtering/search endpoints later

---

## Phase 3: Client-Side Schema Viewer Components

### 3a. Schema Tree Node (`schema-node.tsx`)

Recursive component rendering a `DocNode` as an interactive tree.

```
app/src/components/schema-docs/
├── schema-node.tsx      ← Recursive tree node renderer
├── property-card.tsx    ← Detail panel for selected property
└── schema-search.tsx    ← Search/filter bar
```

**Node rendering by type:**

| DocNode.type | UI |
|--------------|-----|
| `object` | Mantine `Accordion` with property list |
| `array` | `[<itemType>]` with clickable item type |
| `record` | `record<string, <valueType>>` with clickable value type |
| `union` / `discriminatedUnion` | Tabbed or list view of alternatives |
| `tuple` | List of indexed alternatives `[0]`, `[1]`, ... |
| `enum` | Badge showing `draft | published | archived | retracted` |
| `literal` | Colored badge showing `"LUT"`, `"CrossSection"`, etc. |
| Primitives (`string`/`number`/`boolean`) | `Badge` with type name + `Text` with description |

**Property cards:** Clicking a property opens a detail view showing the full description, type info, and required/optional status.

### 3b. Property Detail Card (`property-card.tsx`)

```tsx
<Card>
  <Text size="lg">{propertyName}: {typeString}</Text>
  {isOptional && <Badge variant="light">optional</Badge>}
  {description && <Text>{description}</Text>}
  {hasProperties && <SchemaNode node={properties} />}
</Card>
```

### 3c. Search Component (`schema-search.tsx`)

```tsx
<TextInput
  leftSection={<IconSearch size="0.9rem" />}
  placeholder="Search schema properties..."
  onChange={(e) => setQuery(e.target.value)}
/>
```

- Filters properties by name and description
- Highlights matching nodes
- Debounced for performance

---

## Phase 4: Page Integration

### 4a. Page Structure

```
app/src/app/schema-docs/
├── page.tsx           ← Server wrapper (fetches data)
└── page-client.tsx    ← Client page with layout
```

### 4b. Layout

Two-panel layout using `AppShell`:

```
┌─────────────────────────────────────────────────────┐
│  Header: "VersionedLTPDocumentWithReference"        │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Main Area                               │
│          │                                          │
│ Schema   │  ┌─ Breadcrumb ─┐                        │
│ Structure│  │ Root > ... > │                        │
│          │  │ Selected Prop│                        │
│  • $schema│                                          │
│  • url    │  [SchemaNode tree with expand/collapse] │
│  • ...    │                                          │
│          │                                          │
│          │  ┌─ Detail Panel (collapsible) ──┐       │
│          │  │ Full description + type info   │       │
│          │  └────────────────────────────────┘       │
└──────────┴──────────────────────────────────────────┘
```

### 4c. Navbar Update

Add "Schema Reference" to the Documentation dropdown:

```tsx
// app/src/layout/header/nav-bar.tsx
{ link: "/schema-docs", label: "Schema Reference" }
```

---

## Phase 5: Polish & Enhancements

### 5a. Type Icons

Use `@tabler/icons-react` for type indicators:

| Type | Icon |
|------|------|
| object | `IconTypes` |
| string | `IconTypeString` |
| number | `IconTypeNumber` |
| boolean | `IconTypeBoolean` |
| array | `IconList` |
| union/discriminatedUnion | `IconBrandTypescript` |
| enum | `IconCircleDot` |
| literal | `IconHash` |
| type reference | `IconLink` |

### 5b. Cross-References

When a node has a `registeredId`, render the name as a clickable link that navigates to the definition. Use `buildTypeMap()` to resolve IDs to their full schema.

### 5c. JSON Preview

Add a toggle button to switch between "Tree view" and "Raw JSON schema" (using the existing `@lxcat/schema/json-schema` export).

### 5d. Navigation

- **Breadcrumb bar:** Shows the path to the currently selected node
- **Link to API docs:** Add a link from `/schema-docs` to `/api-doc` and vice versa

---

## File Structure Summary

```
packages/schema/src/
  introspection.ts          ← Phase 1 (DONE)
  introspection.test.ts     ← Phase 1 tests (DONE)
  index.ts                  ← Phase 1 export update (DONE)

app/src/
  app/
    schema-docs/
      page.tsx              ← Phase 4: server page
      page-client.tsx       ← Phase 4: client page
  api/
    schema-docs/
      route.ts              ← Phase 2: API route
  components/
    schema-docs/
      schema-node.tsx       ← Phase 3: recursive tree node
      property-card.tsx     ← Phase 3: detail panel
      schema-search.tsx     ← Phase 3: search bar
```

---

## Dependencies

No new dependencies needed. Uses existing:

- `@mantine/core` — UI components (`AppShell`, `Accordion`, `Card`, `Badge`, `Text`, `TextInput`)
- `@tabler/icons-react` — type icons
- `@lxcat/schema` — schema definitions + introspection

---

## Type Tree Reference

The full type tree for `VersionedLTPDocumentWithReference`:

```
VersionedLTPDocumentWithReference (= intersection(SelfReference, VersionedDocumentBody))
├── SelfReference (left side of intersection)
│   ├── $schema: string
│   ├── url: string (described)
│   └── termsOfUse: string (described)
├── VersionedDocumentBody (right side of intersection)
│   ├── contributor: Contributor
│   │   ├── name: string
│   │   ├── description: string
│   │   ├── contact: string
│   │   ├── howToReference: string
│   │   └── totalSets?: number (int, min 1)
│   ├── name: string
│   ├── publishedIn?: string (described) — key into references
│   ├── description: string (described)
│   ├── complete: boolean
│   ├── _key: string (min 1)
│   ├── versionInfo: VersionInfo
│   │   ├── version: number (int, positive)
│   │   ├── createdOn: iso.datetime
│   │   ├── status: "draft" | "published" | "archived" | "retracted"
│   │   ├── commitMessage?: string (described)
│   │   └── retractMessage?: string (described)
│   ├── references: record<string, Reference | string>
│   │   └── Reference (= CSLData — ~80 bibliographic fields)
│   ├── states: record<string, SerializedSpecies>
│   │   └── SerializedSpecies
│   │       ├── detailed: AnySpecies (discriminated union)
│   │       │   ├── Electron
│   │       │   ├── Atom variants (LS1, LSJ, LS, J1L2, etc.)
│   │       │   ├── Molecule variants (HomonuclearDiatom, etc.)
│   │       │   └── Unspecified
│   │       └── serialized: StateSummary
│   │           ├── summary: SummarizedComponent
│   │           ├── composition: SummarizedComponent
│   │           └── electronic?: OneOrMultiple(ElectronicState)
│   └── processes: array(VersionedProcess)
│       ├── reaction: Reaction(StateSummary)
│       │   ├── lhs: array(ReactionEntry)
│       │   ├── rhs: array(ReactionEntry)
│       │   ├── reversible: boolean
│       │   └── typeTags: array(ReactionTypeTag)
│       └── info: array(CrossSectionInfo)
│           ├── type: "CrossSection"
│           ├── comments?: array<string>
│           ├── references: array(Reference | string)
│           ├── data: LUT
│           │   ├── type: "LUT"
│           │   ├── labels: [string, string]
│           │   ├── units: [string, string]
│           │   └── values: array<[number, number]>
│           └── parameters?: CrossSectionParameters
│               ├── massRatio?: number (positive)
│               └── statisticalWeightRatio?: number (positive)
```
