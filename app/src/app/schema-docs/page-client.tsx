// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";

import {
  Badge,
  Box,
  Burger,
  Divider,
  Drawer,
  Group,
  ScrollArea,
  Select,
  Text,
  Title,
} from "@mantine/core"
import { IconSchema, IconArrowLeft } from "@tabler/icons-react";
import { DocNode, DocProperty, DocTypeMap } from "@lxcat/schema";
import { SchemaNode } from "@/components/schema-docs/schema-node";
import { PropertyCard } from "@/components/schema-docs/property-card";
import { SchemaSearch } from "@/components/schema-docs/schema-search";

interface DocsPageClientProps {
  typeMap: DocTypeMap;
  initialTypeId: string;
  initialNode: DocNode;
}

export function DocsPageClient({ typeMap, initialTypeId, initialNode }: DocsPageClientProps) {
  const [currentTypeId, setCurrentTypeId] = useState(initialTypeId);
  const [currentNode, setCurrentNode] = useState<DocNode>(initialNode);
  const [selectedNode, setSelectedNode] = useState<DocNode | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpened, setDrawerOpened] = useState(false);

  const handleSelect = (node: DocNode, _property?: DocProperty) => {
    setSelectedNode(node);
  };

  const handleNavigateToType = (typeId: string) => {
    setCurrentTypeId(typeId);
    const node = typeMap[typeId];
    if (node) {
      setCurrentNode(node);
      setSelectedNode(undefined);
    }
  };

  const handleGoHome = () => {
    setCurrentTypeId(initialTypeId);
    setCurrentNode(initialNode);
    setSelectedNode(undefined);
  };

  const typeEntries = Object.entries(typeMap).sort((a, b) => a[0].localeCompare(b[0]));
  const currentTypeLabel = typeMap[currentTypeId]?.name || currentTypeId;

  return (
    <>
      {/* Header */}
      <Box
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--mantine-color-body)",
          borderBottom: "1px solid var(--mantine-color-gray-3)",
          padding: "8px 24px",
        }}
      >
        <Group justify="space-between">
          <Group gap="md">
            <Burger opened={drawerOpened} onClick={() => setDrawerOpened(true)} hiddenFrom="sm" size="sm" />
            <IconSchema size={24} />
            <Title order={3}>
              Schema Reference
            </Title>
            <Badge size="sm" variant="light" color="gray">
              {typeEntries.length} types
            </Badge>
          </Group>
          <Group gap="sm">
            <Select
              data={typeEntries.map(([id, node]) => ({ value: id, label: node.name || id }))}
              value={currentTypeId}
              onChange={(value) => value && handleNavigateToType(value)}
              style={{ width: 280 }}
              placeholder="Select type..."
              allowDeselect={false}
            />
          </Group>
        </Group>
      </Box>

      {/* Drawer for mobile */}
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title="Schema Reference"
        size="xs"
        padding="md"
      >
        <ScrollArea style={{ height: "calc(100vh - 100px)" }}>
          {typeEntries.map(([id, node]) => (
            <Box
              key={id}
              onClick={() => {
                handleNavigateToType(id);
                setDrawerOpened(false);
              }}
              style={{
                padding: "8px 12px",
                marginBottom: 4,
                borderRadius: 4,
                cursor: "pointer",
                background: id === currentTypeId ? "var(--mantine-color-blue-light)" : "transparent",
              }}
            >
              <Text size="sm" fw={id === currentTypeId ? 600 : 400}>
                {node.name || id}
              </Text>
            </Box>
          ))}
        </ScrollArea>
      </Drawer>

      {/* Main content */}
      <Box style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 24px" }}>
        {/* Breadcrumb / Current type info */}
        <Group mb="md" py="sm" wrap="wrap">
          <Box
            onClick={handleGoHome}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconArrowLeft size={14} />
            <Text size="sm" c="blue" fw={500}>
              {initialNode.name}
            </Text>
          </Box>
          {currentTypeId !== initialTypeId && (
            <>
              <Text size="xs" c="dimmed">/</Text>
              <Badge size="sm" variant="light" color="blue">
                {currentTypeLabel}
              </Badge>
            </>
          )}
        </Group>

        <SchemaSearch onSearch={setSearchTerm} />
        <Box style={{ display: "flex", gap: 24, marginTop: 16 }}>
          {/* Left: Tree */}
          <Box style={{ flex: "0 0 55%", maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
            <SchemaNode
              node={currentNode}
              onSelect={handleSelect}
              searchTerm={searchTerm}
              expanded={true}
              typeMap={typeMap}
              onNavigateToType={handleNavigateToType}
            />
          </Box>
          {/* Right: Detail Panel */}
          <Box style={{ flex: "1", maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
            {selectedNode ? (
              <PropertyCard
                node={selectedNode}
                propertyName={selectedNode.name}
                typeMap={typeMap}
                onNavigateToType={handleNavigateToType}
              />
            ) : (
              <Box style={{ padding: 24 }}>
                <Text c="dimmed">
                  Click on a node in the tree to view details
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
