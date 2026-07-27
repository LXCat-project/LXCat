// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";

import { PropertyCard } from "@/components/schema-docs/property-card";
import { SchemaNode } from "@/components/schema-docs/schema-node";
import { SchemaSearch } from "@/components/schema-docs/schema-search";
import { DocNode, DocProperty, DocTypeMap } from "@lxcat/schema";
import {
  Alert,
  Badge,
  Box,
  Burger,
  Combobox,
  Drawer,
  Group,
  InputBase,
  ScrollArea,
  Text,
  Title,
  useCombobox,
} from "@mantine/core";
import { IconInfoCircle, IconSchema, IconX } from "@tabler/icons-react";

// Root schemas that are displayed in a separate group in the combobox
const ROOT_SCHEMA_IDS = [
  "LTPMixtureWithReference",
  "NewLTPDocument",
  "EditedLTPDocument",
  "VersionedLTPDocumentWithReference",
];

interface DocsPageClientProps {
  typeMap: DocTypeMap;
  initialTypeId: string;
  initialNode: DocNode;
}

export function DocsPageClient(
  { typeMap, initialTypeId, initialNode }: DocsPageClientProps,
) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [currentTypeId, setCurrentTypeId] = useState(initialTypeId);
  const [currentNode, setCurrentNode] = useState<DocNode>(initialNode);
  const [selectedNode, setSelectedNode] = useState<DocNode | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [dismissible, setDismissible] = useState(true);

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

  const typeEntries = Object.entries(typeMap).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  // Separate root schemas from common schemas for combobox grouping
  const rootTypeEntries = typeEntries.filter(([id]) =>
    ROOT_SCHEMA_IDS.includes(id)
  );
  const commonTypeEntries = typeEntries.filter(([id]) =>
    !ROOT_SCHEMA_IDS.includes(id)
  );

  // Build combined options for the combobox
  const combinedOptions = [
    {
      group: "Root schemas",
      options: rootTypeEntries.map(([id, node]) => ({
        value: id,
        label: node.name || id,
      })),
    },
    {
      group: "Common schemas",
      options: commonTypeEntries.map(([id, node]) => ({
        value: id,
        label: node.name || id,
      })),
    },
  ];

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
            <Burger
              opened={drawerOpened}
              onClick={() => setDrawerOpened(true)}
              hiddenFrom="sm"
              size="sm"
            />
            <IconSchema size={24} />
            <Title order={3}>
              Schema Reference
            </Title>
            <Badge size="sm" variant="light" color="gray">
              {typeEntries.length} types
            </Badge>
          </Group>
          <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
              handleNavigateToType(val);
              combobox.closeDropdown();
            }}
          >
            <Combobox.Target>
              <InputBase
                component="button"
                type="button"
                pointer
                rightSection={<Combobox.Chevron />}
                rightSectionPointerEvents="none"
                onClick={() => combobox.toggleDropdown()}
                style={{ width: 320 }}
              >
                {typeMap[currentTypeId]?.name || currentTypeId}
              </InputBase>
            </Combobox.Target>

            <Combobox.Dropdown
              style={{ maxHeight: 400, overflowY: "auto" }}
            >
              <Combobox.Options>
                {combinedOptions.map(group => (
                  <Combobox.Group key={group.group} label={group.group}>
                    {group.options.map(option => (
                      <Combobox.Option
                        key={option.value}
                        value={option.value}
                        active={option.value === currentTypeId}
                      >
                        {option.label}
                      </Combobox.Option>
                    ))}
                  </Combobox.Group>
                ))}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
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
                background: id === currentTypeId
                  ? "var(--mantine-color-blue-light)"
                  : "transparent",
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
        {/* Page description */}
        {dismissible && (
          <Alert
            mt={24}
            mb="md"
            variant="light"
            color="blue"
            icon={<IconInfoCircle />}
            title="About this page"
            onClose={() => setDismissible(false)}
          >
          On this page you can explore the <code>LTPMixtureWithReference</code>
          {" "}
          schema, which defines the structure of all output data (website and
          API) in LXCat. If you want to implement support for LXCat data in your
          simulation tool, this is the structure of the data that you can
          expect.
          <br />
          <br />
          Contributors that want to upload data via the API use two other root
          schemas: <code>NewLTPDocument</code> for providing new datasets, and
          {" "}
          <code>EditedLTPDocument</code> for updating existing datasets.
          <br />
          <br />
          The type list also includes common schemas shared between root types.
          You can navigate to any schema in the combobox or sidebar to view its
          structure.
          </Alert>
        )}

        <SchemaSearch onSearch={setSearchTerm} />
        <Box style={{ display: "flex", gap: 24, marginTop: 16 }}>
          {/* Left: Tree */}
          <Box
            style={{
              flex: "0 0 55%",
              maxHeight: "calc(100vh - 240px)",
              overflowY: "auto",
            }}
          >
            <SchemaNode
              key={currentNode.name}
              node={currentNode}
              onSelect={handleSelect}
              searchTerm={searchTerm}
              expanded={true}
              typeMap={typeMap}
              onNavigateToType={handleNavigateToType}
            />
          </Box>
          {/* Right: Detail Panel */}
          <Box
            style={{
              flex: "1",
              maxHeight: "calc(100vh - 240px)",
              overflowY: "auto",
            }}
          >
            {selectedNode
              ? (
                <PropertyCard
                  node={selectedNode}
                  propertyName={selectedNode.name}
                  typeMap={typeMap}
                  onNavigateToType={handleNavigateToType}
                />
              )
              : (
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
