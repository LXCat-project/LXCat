// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Badge, Box, Card, Group, Text, Title, Anchor } from "@mantine/core";
import { DocNode, DocTypeMap } from "@lxcat/schema";
import { SchemaNode } from "./schema-node";

interface PropertyCardProps {
  node: DocNode;
  propertyName?: string;
  typeMap?: DocTypeMap;
  onNavigateToType?: (typeId: string) => void;
}

/** Renders a detailed card view for a selected schema node */
export function PropertyCard({ node, propertyName, typeMap, onNavigateToType }: PropertyCardProps) {
  const handleNavigate = () => {
    if (node.registeredId && onNavigateToType) {
      onNavigateToType(node.registeredId!);
    }
  };

  return (
    <Card
      radius="md"
      shadow="sm"
      padding="lg"
      style={{ height: "100%", overflow: "auto" }}
    >
      <Title order={3} mb="xs">
        {propertyName || node.name || "(root)"}
        {node.registeredId && typeMap && onNavigateToType && (
          <Badge
            size="sm"
            variant="filled"
            color="indigo"
            ml="md"
            style={{ cursor: "pointer", textTransform: "none" }}
            onClick={handleNavigate}
          >
            {node.registeredId}
          </Badge>
        )}
      </Title>

      <Box mb="md">
        <Badge
          size="lg"
          variant="light"
          color={getTypeColor(node.type)}
        >
          {node.type}
        </Badge>
        {!node.required && (
          <Badge size="lg" variant="light" color="gray" ml="sm">
            optional
          </Badge>
        )}
      </Box>

      {node.description && (
        <Text mb="md" size="sm">
          {node.description}
        </Text>
      )}

      {/* Show literal value if present */}
      {node.value !== undefined && (
        <Box mb="md">
          <Text size="xs" c="dimmed">
            Value
          </Text>
          <Badge size="md" variant="light" color="indigo" style={{ textTransform: "none" }}>
            {JSON.stringify(node.value)}
          </Badge>
        </Box>
      )}

      {/* Show enum values if present */}
      {node.type === "enum" && node.itemType && (
        <Box mb="md">
          <Text size="xs" c="dimmed">
            Allowed values
          </Text>
          <Group gap="xs" wrap="wrap" mt="xs">
            {node.itemType.split(" | ").map((val, i) => (
              <Badge key={i} size="md" variant="light" color="teal" style={{ textTransform: "none" }}>
                {val}
              </Badge>
            ))}
          </Group>
        </Box>
      )}

      {/* Show item type for arrays/records */}
      {(node.type === "array" || node.type === "record" || node.type === "tuple") && node.itemType && (
        <Box mb="md">
          <Text size="xs" c="dimmed">
            Item type
          </Text>
          <Text size="sm" fw={500}>
            {node.itemType}
          </Text>
          {/* Show enum values if item type is enum */}
          {node.itemType === "enum" && node.itemNode?.type === "enum" && node.itemNode?.itemType && (
            <Group gap="xs" wrap="wrap" mt="xs">
              {node.itemNode.itemType.split(" | ").map((val, i) => (
                <Badge key={i} size="md" variant="light" color="teal" style={{ textTransform: "none" }}>
                  {val}
                </Badge>
              ))}
            </Group>
          )}
          {/* Show object properties if item type is object */}
          {node.itemNode?.type === "object" && node.itemNode?.properties && (
            <Box mt="xs">
              {node.itemNode.properties.map((prop) => (
                <Box key={prop.name} mb="xs">
                  <Text size="sm" fw={500}>
                    {prop.name}{" "}
                    {!prop.node.required && (
                      <Badge size="xs" variant="light" color="gray">optional</Badge>
                    )}
                  </Text>
                  <Text size="xs" c="dimmed">
                    → {prop.node.type}
                  </Text>
                  {prop.node.description && (
                    <Text size="xs" c="dimmed">
                      {prop.node.description}
                    </Text>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Show alternatives for unions */}
      {node.alternatives && node.alternatives.length > 0 && (
        <Box>
          <Text size="xs" c="dimmed" mb="xs">
            Alternatives ({node.alternatives.length})
          </Text>
          {node.alternatives.map((alt, i) => (
            <Badge
              key={i}
              size="sm"
              variant="light"
              color={getTypeColor(alt.type)}
              mr="xs"
              mb="xs"
              style={{ textTransform: "none" }}
            >
              {alt.name || `Option ${i + 1}`}
            </Badge>
          ))}
        </Box>
      )}

      {/* Recursively show children */}
      {node.properties && node.properties.length > 0 && (
        <Box mt="md">
          <Text size="xs" c="dimmed" mb="xs">
            Properties ({node.properties.length})
          </Text>
          {node.properties.map((prop) => (
            <Box key={prop.name} mb="xs">
              <Text size="sm" fw={500}>
                {prop.name}{" "}
                {!prop.node.required && (
                  <Badge size="xs" variant="light" color="gray">
                    optional
                  </Badge>
                )}
                {prop.node.registeredId && typeMap && onNavigateToType && (
                  <Anchor
                    size="xs"
                    color="indigo"
                    ml="xs"
                    style={{ cursor: "pointer", textTransform: "none" }}
                    onClick={() => onNavigateToType(prop.node.registeredId!)}
                  >
                    → {prop.node.registeredId}
                  </Anchor>
                )}
              </Text>
              <Text size="xs" c="dimmed">
                → {prop.node.type}
                {prop.node.itemType ? ` <${prop.node.itemType}>` : ""}
              </Text>
              {prop.node.description && (
                <Text size="xs" c="dimmed">
                  {prop.node.description}
                </Text>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case "string": return "green";
    case "number": return "orange";
    case "boolean": return "purple";
    case "object": return "blue";
    case "array": return "cyan";
    case "union": return "red";
    case "discriminatedUnion": return "red";
    case "enum": return "teal";
    case "literal": return "indigo";
    case "tuple": return "violet";
    case "record": return "pink";
    case "intersection": return "grape";
    case "lazy": return "gray";
    default: return "gray";
  }
}
