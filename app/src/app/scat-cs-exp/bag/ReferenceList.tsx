"use client";

import { List } from "@mantine/core";
import { Reference } from "./Reference";
import { FormattedReference } from "./types";

export const ReferenceList = ({ references }: { references: Array<FormattedReference> }) => (
  <List>
    {references.map((ref) => (
      <List.Item key={ref.id}>
        <Reference>{ref}</Reference>
      </List.Item>
    ))}
  </List>
)
