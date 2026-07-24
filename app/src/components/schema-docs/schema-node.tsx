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
  intersection: { icon: IconLayoutGrid, color: "grape" },
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

  // --- Object types with properties ---
  if (node.properties && node.properties.length > 0) {
    const filteredProps = term
      ? node.properties.filter((p) => matchesSearch(p.node, term))
      : node.properties;

    return (
      <Accordion.Item value={nodeId(node)}>
        <Accordion.Control
          onClick={handleSelect}
          style={{
            fontWeight: isSelected ? 600 : undefined,
            color: isSelected ? "var(--mantine-color-blue-filled)" : undefined,
            paddingLeft: depth * 16 + 12,
          }}
        >
          <Group gap="xs">
            <Icon size={14} color={iconInfo.color} />
            <Text span size="sm" fw={600}>
              {highlight(node.name || "(root)")}
            </Text>
            <Badge
              size="xs"
              variant="light"
              color={iconInfo.color}
              style={{ textTransform: "none" }}
            >
              {node.properties.length} props
            </Badge>
            {!node.required && (
              <Badge size="xs" variant="light" color="gray">optional</Badge>
            )}
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          {node.description && (
            <Text size="xs" c="dimmed" mb="xs" pl={depth * 16 + 12}>
              {highlight(node.description)}
            </Text>
          )}
          <Box pl={depth * 16 + 24}>
            {filteredProps.map((prop) => (
              <PropertyRow
                key={prop.name}
                property={prop}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                searchTerm={term}
              />
            ))}
          </Box>
        </Accordion.Panel>
      </Accordion.Item>
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

  // --- Union / DiscriminatedUnion ---
  if (node.alternatives && node.alternatives.length > 0) {
    return (
      <Box style={{ paddingLeft: depth * 16 + 12 }}>
        <Group gap="xs" wrap="nowrap">
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
            {highlight(node.name)}
          </Text>
          <Badge size="xs" variant="light" color={iconInfo.color}>
            {node.alternatives.length} options
          </Badge>
          {!node.required && (
            <Badge size="xs" variant="light" color="gray">optional</Badge>
          )}
        </Group>
        <Box pl={depth * 16 + 32} mt="xs">
          {node.alternatives.map((alt, i) => (
            <SchemaNode
              key={`${i}_${nodeId(alt)}`}
              node={alt}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={term}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // --- Leaf nodes ---
  return (
    <Box style={{ paddingLeft: depth * 16 + 12 }}>
      <Group gap="xs">
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
        {node.itemType && (
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

  const filteredItems = searchTerm
    ? nodeMatchesOrHasMatchingChild(itemNode, searchTerm)
    : true;

  return (
    <Box style={{ paddingLeft: depth * 16 + 12 }}>
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
      {expanded && (
        <Box pl={16} mt="xs">
          <SchemaNode
            node={itemNode}
            depth={depth + 1}
            onSelect={onSelect}
            selectedId={selectedId}
            searchTerm={searchTerm}
          />
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
      depth={depth}
      onSelect={(node) => onSelect?.(node, property)}
      selectedId={selectedId}
      searchTerm={searchTerm}
    />
  );
}

export { SchemaNode };
