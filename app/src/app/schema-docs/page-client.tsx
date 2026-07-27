// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";

import {
  Box,
  Group,
  Text,
  Title,
} from "@mantine/core";
import { IconSchema } from "@tabler/icons-react";
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

  return (
    <Box style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
      <Group mb="md" py="md">
        <IconSchema size={24} />
        <Title order={2}>
          {currentNode.name || "Schema Reference"}
        </Title>
        <Text size="xs" c="dimmed">
          Schema reference for datasets downloaded from LXCat
        </Text>
      </Group>
      <SchemaSearch onSearch={setSearchTerm} />
      <Box style={{ display: "flex", gap: 24, marginTop: 16 }}>
        {/* Left: Tree */}
        <Box style={{ flex: "0 0 55%", maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
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
        <Box style={{ flex: "1", maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
          {selectedNode ? (
            <PropertyCard
              node={selectedNode}
              propertyName={selectedNode.name}
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
  );
}
