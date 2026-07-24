// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";

import {
  Accordion,
  AppShell,
  AppShellMain,
  AppShellNavbar,
  Breadcrumbs,
  Center,
  Group,
  ScrollArea,
  Text,
  Title,
} from "@mantine/core";
import { IconSchema } from "@tabler/icons-react";
import { DocNode } from "@lxcat/schema";
import { SchemaNode } from "@/components/schema-docs/schema-node";
import { PropertyCard } from "@/components/schema-docs/property-card";
import { SchemaSearch } from "@/components/schema-docs/schema-search";

interface DocsPageClientProps {
  rootNode: DocNode;
}

export function DocsPageClient({ rootNode }: DocsPageClientProps) {
  const [selectedNode, setSelectedNode] = useState<DocNode | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (node: DocNode) => {
    setSelectedNode(node);
  };

  const breadcrumb = generateBreadcrumbs(selectedNode, rootNode);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 400, breakpoint: "sm" }}
      padding="md"
    >
      <AppShellNavbar>
        <Center h="60px">
          <Group>
            <IconSchema size={20} />
            <Title order={4} lh="1">
              Schema Structure
            </Title>
          </Group>
        </Center>
        <SchemaSearch onSearch={setSearchTerm} />
        <ScrollArea style={{ height: "calc(100vh - 140px)" }}>
          <Accordion variant="contained" chevronPosition="left" multiple defaultValue={[]}>
            <SchemaNode
              node={rootNode}
              onSelect={handleSelect}
              searchTerm={searchTerm}
            />
          </Accordion>
        </ScrollArea>
      </AppShellNavbar>
      <AppShellMain>
        <Group mb="md">
          <Title order={2}>
            VersionedLTPDocumentWithReference
          </Title>
          <Text size="xs" c="dimmed" ml="xs">
            Schema reference for datasets downloaded from LXCat
          </Text>
        </Group>
        {breadcrumb.length > 1 && (
          <Breadcrumbs mb="md">
            {breadcrumb.map((crumb, i) => (
              <Text
                key={i}
                size="sm"
                c={i === breadcrumb.length - 1 ? "dark" : "dimmed"}
                fw={i === breadcrumb.length - 1 ? 500 : undefined}
              >
                {i > 0 && " > "}
                {crumb}
              </Text>
            ))}
          </Breadcrumbs>
        )}
        <Center h="calc(100vh - 200px)">
          <div style={{ width: "100%", maxWidth: 800 }}>
            {selectedNode ? (
              <PropertyCard
                node={selectedNode}
                propertyName={selectedNode.name}
              />
            ) : (
              <Center h="100%">
                <Text c="dimmed">
                  Click on a property in the sidebar to view details
                </Text>
              </Center>
            )}
          </div>
        </Center>
      </AppShellMain>
    </AppShell>
  );
}

// Generate breadcrumb trail from root to selected node
function generateBreadcrumbs(
  selected: DocNode | undefined,
  root: DocNode,
): string[] {
  if (!selected) return [root.name || "root"];

  // For the initial implementation, show just the property name
  // A full breadcrumb would require tracking the path during selection
  return [root.name || "root", selected.name || "(root)"];
}
