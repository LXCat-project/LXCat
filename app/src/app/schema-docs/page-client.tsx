// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";

import {
  Box,
  Center,
  Group,
  Text,
  Title,
} from "@mantine/core";
import { IconSchema } from "@tabler/icons-react";
import { DocNode, DocProperty } from "@lxcat/schema";
import { SchemaNode } from "@/components/schema-docs/schema-node";
import { SchemaSearch } from "@/components/schema-docs/schema-search";

interface DocsPageClientProps {
  rootNode: DocNode;
}

export function DocsPageClient({ rootNode }: DocsPageClientProps) {
  const [selectedNode, setSelectedNode] = useState<DocNode | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (node: DocNode, property?: DocProperty) => {
    setSelectedNode(property?.node || node);
  };

  return (
    <Box style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
      <Group mb="md" py="md">
        <IconSchema size={24} />
        <Title order={2}>
          {rootNode.name || "Schema Reference"}
        </Title>
        <Text size="xs" c="dimmed">
          Schema reference for datasets downloaded from LXCat
        </Text>
      </Group>
      <SchemaSearch onSearch={setSearchTerm} />
      <Box style={{ marginTop: 16 }}>
        <SchemaNode
          node={rootNode}
          onSelect={handleSelect}
          searchTerm={searchTerm}
          expanded={true}
        />
      </Box>
    </Box>
  );
}
