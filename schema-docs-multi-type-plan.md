# Multi-Type Schema Documentation Viewer — Implementation Plan

## Goal
Enable users to browse any registered schema type, not just `VersionedLTPDocumentWithReference`. Clicking on a registered type reference navigates to that type's subtree.

## Current State
- `DocNode` has `registeredId` on nodes that reference registered types
- `buildTypeMap()` already builds a `{ id: DocNode }` map of all registered types
- `getRootDocNode()` returns a single tree for `VersionedLTPDocumentWithReference`
- UI is a two-panel layout (tree + detail) with no type switching

## Changes Required

### 1. Introspection Layer (`packages/schema/src/introspection.ts`)

**1a. Add type resolution function**
```ts
export function resolveTypeNode(typeId: string, typeMap: DocTypeMap): DocNode | undefined
```
- Looks up `typeId` in `typeMap`
- Returns the `DocNode` for that type, or `undefined` if not found

**1b. (Optional) Add type discovery from a root type**
```ts
export function findReferencedTypes(rootNode: DocNode, typeMap: DocTypeMap): Set<string>
```
- Traverses `rootNode` tree to find all `registeredId` values
- Returns a set of type IDs referenced by the root type and its descendants

### 2. Page Component (`app/src/app/schema-docs/page.tsx`)

**2a. Accept optional type parameter**
```tsx
interface SchemaDocsPageProps {
  initialTypeId?: string; // e.g., "Atom", "ShellEntry"
}
```

**2b. Build type map server-side**
- Call `buildTypeMap()` to get all registered types
- Pass `typeMap` to client component

**2c. Determine initial type**
- If `initialTypeId` is provided, resolve that type
- Otherwise, default to `VersionedLTPDocumentWithReference`

### 3. Client Component (`app/src/app/schema-docs/page-client.tsx`)

**3a. Add type state and navigation**
```ts
const [typeMap, setTypeMap] = useState<DocTypeMap>(initialTypeMap);
const [currentTypeId, setCurrentTypeId] = useState<string>(initialTypeId || "VersionedLTPDocumentWithReference");
const [currentNode, setCurrentNode] = useState<DocNode>(initialNode);
```

**3b. Add type selector**
- Dropdown or list showing all registered types
- Can be in the header or a collapsible sidebar section
- Shows type name (e.g., "Atom", "CSLData")

**3c. Add type navigation handler**
```ts
const handleNavigateToType = (typeId: string) => {
  const node = resolveTypeNode(typeId, typeMap);
  if (node) {
    setCurrentTypeId(typeId);
    setCurrentNode(node);
    setSelectedNode(undefined); // Reset property selection
  }
};
```

**3d. Update breadcrumbs/header**
- Show current type name prominently
- Add breadcrumb trail: `VersionedLTPDocumentWithReference > Atom > ShellEntry`

### 4. Schema Node Component (`app/src/components/schema-docs/schema-node.tsx`)

**4a. Thread `typeMap` and `onNavigateToType`**
- Add props to `SchemaNode`: `typeMap?: DocTypeMap`, `onNavigateToType?: (typeId: string) => void`
- Pass down through `CollapsibleObject`, `UnionNode`, `ArrayNode`, `RecordNode`, `AltNode`

**4b. Make `registeredId` badges clickable**
- When clicked, call `onNavigateToType(node.registeredId!)`
- Currently only works for leaf nodes; extend to `CollapsibleObject` headers

### 5. Property Card Component (`app/src/components/schema-docs/property-card.tsx`)

**5a. Add cross-reference link**
- If `node.registeredId` exists, show a link/button to navigate to that type

## UI/UX Considerations

**Type Selector Design:**
- Dropdown in header for quick switching
- Or expandable section at top of tree showing "Related Types"

**Breadcrumb Navigation:**
- `VersionedLTPDocumentWithReference` > `states[].detailed[0].composition` > `Atom`
- Clickable segments to jump to any level

**Visual Indicators:**
- Registered type references in tree should be clearly clickable (indigo badge)
- Current type should be highlighted
- Show type count (e.g., "25 types in schema")

## Implementation Order
1. **Phase 1**: Add `resolveTypeNode()` to introspection.ts
2. **Phase 2**: Pass `typeMap` through page.tsx → page-client.tsx
3. **Phase 3**: Add type selector and navigation in page-client.tsx
4. **Phase 4**: Thread `typeMap`/`onNavigateToType` through schema-node.tsx components
5. **Phase 5**: Update PropertyCard to show cross-reference links

## Files to Modify
- `packages/schema/src/introspection.ts` — Add `resolveTypeNode()`
- `app/src/app/schema-docs/page.tsx` — Accept `initialTypeId`, pass `typeMap`
- `app/src/app/schema-docs/page-client.tsx` — Type state, selector, navigation
- `app/src/components/schema-docs/schema-node.tsx` — Thread props, enable cross-type clicks
- `app/src/components/schema-docs/property-card.tsx` — Show type reference links
