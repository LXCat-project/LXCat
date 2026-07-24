// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  Accordion,
  Badge,
  Box,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconBrandTypescript,
  IconCircleDot,
  IconChevronRight,
  IconHash,
  IconLayoutGrid,
  IconList,
  IconNumber,
  IconTextCaption,
} from "@tabler/icons-react";
import { useState } from "react";
import {
  DocNode,
  DocProperty,
} from "@lxcat/schema";
import { PropertyCard } from "./property-card";

interface SchemaNodeProps {
  node: DocNode;
  depth?: number;
  onSelect?: (node: DocNode, property?: DocProperty) => void;
  selectedId?: string;
  searchTerm?: string;
  expanded?: boolean;
}

// Type icon mapping
const typeIcons: Record<string, { icon: typeof IconLayoutGrid; color: string }> = {
  object: { icon: IconLayoutGrid, color: "blue" },
  string: { icon: IconTextCaption, color: "green" },
  number: { icon: IconNumber, color: "orange" },
  boolean: { icon: IconCircleDot, color: "purple" },
  array: { icon: IconList, color: "cyan" },
  union: { icon: IconBrandTypescript, color: "red" },
  discriminatedUnion: { icon: IconBrandTypescript, color: "red" },
  enum: { icon: IconHash, color: "teal" },
  literal: { icon: IconHash, color: "indigo" },
  tuple: { icon: IconList, color: "violet" },
  record: { icon: IconLayoutGrid, color: "pink" },
  intersection: { icon: IconLayoutGrid, color: "blue" },
  lazy: { icon: IconLayoutGrid, color: "gray" },
};

// Match a node against a search term (case-insensitive)
function matchesSearch(node: DocNode, searchTerm: string): boolean {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  return (
    node.name.toLowerCase().includes(term) ||
    node.type.toLowerCase().includes(term) ||
    (node.description?.toLowerCase().includes(term) ?? false)
  );
}

// Check if a node or any of its children match the search
function nodeMatchesOrHasMatchingChild(node: DocNode, searchTerm: string): boolean {
  if (!searchTerm) return true;
  if (matchesSearch(node, searchTerm)) return true;
  if (node.properties) {
    return node.properties.some((p) => nodeMatchesOrHasMatchingChild(p.node, searchTerm));
  }
  if (node.itemNode) return nodeMatchesOrHasMatchingChild(node.itemNode, searchTerm);
  if (node.alternatives) {
    return node.alternatives.some((a) => nodeMatchesOrHasMatchingChild(a, searchTerm));
  }
  return false;
}

// Generate a stable unique ID for a node
function nodeId(node: DocNode): string {
  return `${node.name || "(root)"}_${node.type}`;
}

function SchemaNode({
  node,
  depth = 0,
  onSelect,
  selectedId,
  searchTerm,
  expanded,
}: SchemaNodeProps) {
  const iconInfo = typeIcons[node.type] || typeIcons.object;
  const Icon = iconInfo.icon;
  const isSelected = selectedId === nodeId(node);
  const term = searchTerm ?? "";
  const visible = !term || nodeMatchesOrHasMatchingChild(node, term);

  if (!visible) return null;

  const handleSelect = () => {
    if (onSelect) onSelect(node);
  };

  const highlight = (text: string): React.ReactNode => {
    if (!term || !term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <Box
          key={i}
          component="span"
          bg="yellow"
          opacity={0.4}
          px={1}
          style={{ borderRadius: 2 }}
        >
          {part}
        </Box>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  // Unwrap anonymous nodes (empty name) by rendering children directly
  // but NOT unions/tuples - those need their alternatives visible
  if (node.name === "" || node.name === "(root)") {
    // Object with properties: render each property as a SchemaNode at this depth
    if (node.properties && node.properties.length > 0) {
      return (
        <Box>
          {node.properties.map((prop) => (
            <SchemaNode
              key={prop.name}
              node={prop.node}
              depth={depth}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={searchTerm}
            />
          ))}
        </Box>
      );
    }
    if (node.itemNode && (node.type === "array" || node.type === "record")) {
      // If the itemNode is a union or tuple, render alternatives directly (skip wrapper)
      const isTuple = node.itemNode.type === "tuple";
      if (node.itemNode.alternatives) {
        return (
          <Box>
            {node.itemNode.alternatives.map((alt, i) => (
              <AltNode
                key={`${i}_${nodeId(alt)}`}
                node={alt}
                depth={depth}
                optionIndex={i}
                isTuple={isTuple}
                onSelect={onSelect}
                selectedId={selectedId}
                searchTerm={searchTerm}
                highlight={highlight}
                Icon={Icon}
                iconInfo={iconInfo}
              />
            ))}
          </Box>
        );
      }
      return (
        <SchemaNode
          node={node.itemNode}
          depth={depth}
          onSelect={onSelect}
          selectedId={selectedId}
          searchTerm={searchTerm}
        />
      );
    }
  }

  // --- Object types with properties: manual collapsible ---
  if (node.properties && node.properties.length > 0) {
    return (
      <CollapsibleObject
        node={node}
        properties={node.properties}
        depth={depth}
        onSelect={onSelect}
        selectedId={selectedId}
        searchTerm={term}
        highlight={highlight}
        Icon={Icon}
        iconInfo={iconInfo}
        isSelected={isSelected}
        defaultExpanded={expanded}
      />
    );
  }

  // --- Array types with expandable item type ---
  if (node.type === "array" && node.itemNode) {
    return (
      <ArrayNode
        node={node}
        itemNode={node.itemNode}
        depth={depth}
        onSelect={onSelect}
        selectedId={selectedId}
        searchTerm={term}
        highlight={highlight}
        Icon={Icon}
        iconInfo={iconInfo}
        isSelected={isSelected}
      />
    );
  }

  // --- Record types with expandable value type ---
  if (node.type === "record" && node.itemNode) {
    return (
      <RecordNode
        node={node}
        itemNode={node.itemNode}
        depth={depth}
        onSelect={onSelect}
        selectedId={selectedId}
        searchTerm={term}
        highlight={highlight}
        Icon={Icon}
        iconInfo={iconInfo}
        isSelected={isSelected}
      />
    );
  }

  // --- Union / DiscriminatedUnion / Tuple ---
  if (node.alternatives && node.alternatives.length > 0) {
    return (
      <UnionNode
        node={node}
        alternatives={node.alternatives}
        depth={depth}
        onSelect={onSelect}
        selectedId={selectedId}
        searchTerm={searchTerm}
        highlight={highlight}
        Icon={Icon}
        iconInfo={iconInfo}
        isSelected={isSelected}
        isTuple={node.type === "tuple"}
      />
    );
  }

  // --- Leaf nodes ---
  return (
    <Box>
      <Group gap="xs" wrap="wrap">
        <Icon size={14} color={iconInfo.color} />
        <Text
          component="button"
          span
          size="sm"
          c={isSelected ? "blue" : "inherit"}
          fw={isSelected ? 600 : undefined}
          style={{ cursor: "pointer", border: "none", background: "none", padding: 0 }}
          onClick={handleSelect}
        >
          {highlight(node.name || "(anonymous)")}
        </Text>
        <Badge size="xs" variant="light" color={iconInfo.color}>
          {node.type}
        </Badge>
        {!node.required && (
          <Badge size="xs" variant="light" color="gray">optional</Badge>
        )}
        {node.itemType && node.type !== "literal" && (
          <Badge size="xs" variant="outline" color={iconInfo.color}>
            {node.itemType}
          </Badge>
        )}
        {node.value !== undefined && (
          <Tooltip label={`Literal value: ${node.value}`}>
            <Badge size="xs" variant="light" color="indigo">
              {JSON.stringify(node.value)}
            </Badge>
          </Tooltip>
        )}

      </Group>
      {node.description && (
        <Text size="xs" c="dimmed" pl={20}>
          {highlight(node.description)}
        </Text>
      )}
    </Box>
  );
}

// Collapsible object section (manual expand/collapse, no Accordion)
function CollapsibleObject({
  node,
  properties,
  depth,
  onSelect,
  selectedId,
  searchTerm,
  highlight,
  Icon,
  iconInfo,
  isSelected,
  defaultExpanded,
}: {
  node: DocNode;
  properties: DocProperty[];
  depth: number;
  onSelect?: (node: DocNode, property?: DocProperty) => void;
  selectedId?: string;
  searchTerm?: string;
  highlight: (text: string) => React.ReactNode;
  Icon: typeof IconLayoutGrid;
  iconInfo: { icon: typeof IconLayoutGrid; color: string };
  isSelected: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  // Auto-expand if search term matches any children
  const autoExpand = searchTerm && searchTerm.trim() !== "" && nodeMatchesOrHasMatchingChild(node, searchTerm);
  const showChildren = autoExpand || expanded;

  const handleSelect = () => {
    if (onSelect) onSelect(node);
  };

  return (
    <Box>
      {/* Header row: icon → chevron → text */}
      <Group gap="xs" wrap="nowrap">
        <Icon size={14} color={iconInfo.color} />
        <IconChevronRight
          size={14}
          data-chevron
          style={{
            flexShrink: 0, width: 14,
            transition: "transform 150ms",
            transform: expanded ? "rotate(90deg)" : "none",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(!expanded)}
        />
        <Text
          component="button"
          span
          size="sm"
          fw={isSelected ? 600 : undefined}
          c={isSelected ? "blue" : "inherit"}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
          }}
          onClick={handleSelect}
        >
          {highlight(node.name || "(root)")}
        </Text>
        <Badge
          size="xs"
          variant="light"
          color={iconInfo.color}
          style={{ textTransform: "none" }}
        >
          {properties.length} props
        </Badge>
        {!node.required && (
          <Badge size="xs" variant="light" color="gray">optional</Badge>
        )}
      </Group>
      {/* Description */}
      {showChildren && node.description && (
        <Text size="xs" c="dimmed" pl={16} py={2}>
          {highlight(node.description)}
        </Text>
      )}
      {/* Children */}
      {showChildren && (
        <Box pl={16}>
          {properties.map((prop) => (
            <PropertyRow
              key={prop.name}
              property={prop}
              depth={depth}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={searchTerm}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

// Collapsible union node that shows alternatives when expanded
function UnionNode({
  node,
  alternatives,
  depth,
  onSelect,
  selectedId,
  searchTerm,
  highlight,
  Icon,
  iconInfo,
  isSelected,
  isTuple,
}: {
  node: DocNode;
  alternatives: DocNode[];
  depth: number;
  onSelect?: (node: DocNode, property?: DocProperty) => void;
  selectedId?: string;
  searchTerm?: string;
  highlight: (text: string) => React.ReactNode;
  Icon: typeof IconLayoutGrid;
  iconInfo: { icon: typeof IconLayoutGrid; color: string };
  isSelected: boolean;
  isTuple?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const autoExpand = searchTerm && searchTerm.trim() !== "" && nodeMatchesOrHasMatchingChild(node, searchTerm);
  const showChildren = autoExpand || expanded;

  const handleSelect = () => {
    if (onSelect) onSelect(node);
  };

  return (
    <Box>
      {/* Header row: icon → chevron → text */}
      <Group gap="xs" wrap="nowrap">
        <Icon size={14} color={iconInfo.color} />
        <IconChevronRight
          size={14}
          data-chevron
          style={{
            flexShrink: 0, width: 14,
            transition: "transform 150ms",
            transform: expanded ? "rotate(90deg)" : "none",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(!expanded)}
        />
        <Text
          component="button"
          span
          size="sm"
          fw={isSelected ? 600 : undefined}
          c={isSelected ? "blue" : "inherit"}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
          }}
          onClick={handleSelect}
        >
          {highlight(node.name)}
        </Text>
        <Badge
          size="xs"
          variant="light"
          color={iconInfo.color}
          style={{ textTransform: "none" }}
        >
          {alternatives.length} {isTuple ? "elements" : "options"}
        </Badge>
        {!node.required && (
          <Badge size="xs" variant="light" color="gray">optional</Badge>
        )}
      </Group>
      {/* Alternatives */}
      {showChildren && (
        <Box pl={16}>
          {alternatives.map((alt, i) => (
            <AltNode
              key={`${i}_${nodeId(alt)}`}
              node={alt}
              depth={depth + 1}
              optionIndex={i}
              isTuple={isTuple}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={searchTerm}
              highlight={highlight}
              Icon={Icon}
              iconInfo={iconInfo}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

// Render a union alternative without the name wrapper
function AltNode({
  node,
  depth,
  onSelect,
  selectedId,
  searchTerm,
  highlight,
  Icon,
  iconInfo,
  optionIndex,
  isTuple,
}: {
  node: DocNode;
  depth: number;
  onSelect?: (node: DocNode, property?: DocProperty) => void;
  selectedId?: string;
  searchTerm?: string;
  highlight: (text: string) => React.ReactNode;
  Icon: typeof IconLayoutGrid;
  iconInfo: { icon: typeof IconLayoutGrid; color: string };
  optionIndex: number;
  isTuple?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const autoExpand = searchTerm && searchTerm.trim() !== "" && nodeMatchesOrHasMatchingChild(node, searchTerm);
  const showChildren = autoExpand || expanded;

  // Get the correct icon for this alternative based on its type
  const altIconInfo = typeIcons[node.type] || typeIcons.object;

  // Determine label for the alternative
  const typeLabel = node.properties ? "object" : node.type;
  const indexLabel = isTuple ? String(optionIndex) : `Option ${optionIndex + 1}`;
  const label = `${typeLabel} (${indexLabel})`;

  // For tuples, use the element name with type (e.g., "[0]: string")
  const tupleLabel = isTuple && node.name
    ? `${node.name}: ${node.properties ? "object" : node.type}`
    : undefined;

  // Anonymous object alternative: show as collapsible section
  if ((node.name === "" || node.name === "(root)") && node.properties && node.properties.length > 0) {
    return (
      <Box>
        <Group gap="xs" wrap="nowrap">
          <altIconInfo.icon size={14} color={altIconInfo.color} />
          <IconChevronRight
            size={14}
            style={{
              flexShrink: 0, width: 14,
              transition: "transform 150ms",
              transform: expanded ? "rotate(90deg)" : "none",
              cursor: "pointer",
            }}
            onClick={() => setExpanded(!expanded)}
          />
          <Text size="xs" c="dimmed" fw={500}>
            {tupleLabel || label}
          </Text>
        </Group>
        {showChildren && (
          <Box pl={16}>
            {node.properties.map((prop) => (
              <SchemaNode
                key={prop.name}
                node={prop.node}
                depth={depth}
                onSelect={onSelect}
                selectedId={selectedId}
                searchTerm={searchTerm}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Anonymous array/record alternative: show with its item type
  if ((node.name === "" || node.name === "(root)") && node.itemNode) {
    return (
      <Box>
        <Group gap="xs" wrap="nowrap">
          <altIconInfo.icon size={14} color={altIconInfo.color} />
          <IconChevronRight
            size={14}
            style={{
              flexShrink: 0, width: 14,
              transition: "transform 150ms",
              transform: expanded ? "rotate(90deg)" : "none",
              cursor: "pointer",
            }}
            onClick={() => setExpanded(!expanded)}
          />
          <Text size="xs" c="dimmed" fw={500}>
            {tupleLabel || `${node.type} → ${node.itemType} (${indexLabel})`}
          </Text>
        </Group>
        {showChildren && (
          <Box pl={16}>
            <SchemaNode
              node={node.itemNode}
              depth={depth}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={searchTerm}
            />
          </Box>
        )}
      </Box>
    );
  }

  // Anonymous leaf alternative: render with type label
  if (node.name === "" || node.name === "(root)" || !node.properties && !node.itemNode && !node.alternatives) {
    return (
      <Box>
        <Group gap="xs" wrap="nowrap">
          <altIconInfo.icon size={14} color={altIconInfo.color} />
          <Text size="xs" c="dimmed" fw={500}>
            {tupleLabel || `${node.type} (${indexLabel})`}
          </Text>
        </Group>
      </Box>
    );
  }

  // Normal alternative: render with SchemaNode
  return (
    <SchemaNode
      node={node}
      depth={depth}
      onSelect={onSelect}
      selectedId={selectedId}
      searchTerm={searchTerm}
    />
  );
}

// Render a record with expandable value type
function RecordNode({
  node,
  itemNode,
  depth,
  onSelect,
  selectedId,
  searchTerm,
  highlight,
  Icon,
  iconInfo,
  isSelected,
}: {
  node: DocNode;
  itemNode: DocNode;
  depth: number;
  onSelect?: (node: DocNode, property?: DocProperty) => void;
  selectedId?: string;
  searchTerm?: string;
  highlight: (text: string) => React.ReactNode;
  Icon: typeof IconLayoutGrid;
  iconInfo: { icon: typeof IconLayoutGrid; color: string };
  isSelected: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const autoExpand = searchTerm && searchTerm.trim() !== "" && nodeMatchesOrHasMatchingChild(node, searchTerm);
  const showChildren = autoExpand || expanded;

  return (
    <Box>
      <Group gap="xs" wrap="nowrap">
        <Icon
          size={14}
          color={iconInfo.color}
          style={{ cursor: "pointer" }}
          onClick={() => setExpanded(!expanded)}
        />
        <IconChevronRight
          size={12}
          style={{
            cursor: "pointer",
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 150ms",
          }}
          onClick={() => setExpanded(!expanded)}
        />
        <Text
          component="button"
          span
          size="sm"
          c={isSelected ? "blue" : "inherit"}
          fw={isSelected ? 600 : undefined}
          style={{ cursor: "pointer", border: "none", background: "none", padding: 0 }}
          onClick={() => onSelect?.(node)}
        >
          {highlight(node.name)}
        </Text>
        <Badge size="xs" variant="light" color={iconInfo.color}>
          record
        </Badge>
        {!node.required && (
          <Badge size="xs" variant="light" color="gray">optional</Badge>
        )}
        {node.valueType && (
          <Badge size="xs" variant="outline" color={iconInfo.color}>
            {node.valueType}
          </Badge>
        )}
      </Group>
      {showChildren && (
        <Box pl={16}>
          {/* If itemNode is a union or tuple, render alternatives directly with AltNode */}
          {itemNode.alternatives ? (
            itemNode.alternatives.map((alt, i) => (
              <AltNode
                key={`${i}_${nodeId(alt)}`}
                node={alt}
                depth={depth + 1}
                optionIndex={i}
                isTuple={itemNode.type === "tuple"}
                onSelect={onSelect}
                selectedId={selectedId}
                searchTerm={searchTerm}
                highlight={highlight}
                Icon={Icon}
                iconInfo={iconInfo}
              />
            ))
          ) : (
            <SchemaNode
              node={itemNode}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={searchTerm}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

// Render an array with expandable item type
function ArrayNode({
  node,
  itemNode,
  depth,
  onSelect,
  selectedId,
  searchTerm,
  highlight,
  Icon,
  iconInfo,
  isSelected,
}: {
  node: DocNode;
  itemNode: DocNode;
  depth: number;
  onSelect?: (node: DocNode, property?: DocProperty) => void;
  selectedId?: string;
  searchTerm?: string;
  highlight: (text: string) => React.ReactNode;
  Icon: typeof IconLayoutGrid;
  iconInfo: { icon: typeof IconLayoutGrid; color: string };
  isSelected: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const autoExpand = searchTerm && searchTerm.trim() !== "" && nodeMatchesOrHasMatchingChild(node, searchTerm);
  const showChildren = autoExpand || expanded;

  return (
    <Box>
      <Group gap="xs" wrap="nowrap">
        <Icon
          size={14}
          color={iconInfo.color}
          style={{ cursor: "pointer" }}
          onClick={() => setExpanded(!expanded)}
        />
        <IconChevronRight
          size={12}
          style={{
            cursor: "pointer",
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 150ms",
          }}
          onClick={() => setExpanded(!expanded)}
        />
        <Text
          component="button"
          span
          size="sm"
          c={isSelected ? "blue" : "inherit"}
          fw={isSelected ? 600 : undefined}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
          }}
          onClick={() => onSelect?.(node)}
        >
          {highlight(node.name || "(anonymous)")}
        </Text>
        <Badge size="xs" variant="light" color={iconInfo.color}>
          array
        </Badge>
        {!node.required && (
          <Badge size="xs" variant="light" color="gray">optional</Badge>
        )}
        {node.itemType && (
          <Badge size="xs" variant="outline" color={iconInfo.color}>
            {node.itemType}
          </Badge>
        )}
      </Group>
      {showChildren && (
        <Box pl={16}>
          {/* If itemNode is a union or tuple, render alternatives directly with AltNode */}
          {itemNode.alternatives ? (
            itemNode.alternatives.map((alt, i) => (
              <AltNode
                key={`${i}_${nodeId(alt)}`}
                node={alt}
                depth={depth + 1}
                optionIndex={i}
                isTuple={itemNode.type === "tuple"}
                onSelect={onSelect}
                selectedId={selectedId}
                searchTerm={searchTerm}
                highlight={highlight}
                Icon={Icon}
                iconInfo={iconInfo}
              />
            ))
          ) : (
            <SchemaNode
              node={itemNode}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={searchTerm}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

// Render a single property row within an object
function PropertyRow({
  property,
  depth,
  onSelect,
  selectedId,
  searchTerm,
}: {
  property: DocProperty;
  depth: number;
  onSelect?: (node: DocNode, property?: DocProperty) => void;
  selectedId?: string;
  searchTerm?: string;
}) {
  return (
    <SchemaNode
      node={property.node}
      depth={depth + 1}
      onSelect={(node) => onSelect?.(node, property)}
      selectedId={selectedId}
      searchTerm={searchTerm}
    />
  );
}

export { SchemaNode };
