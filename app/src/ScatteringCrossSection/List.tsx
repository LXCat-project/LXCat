// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionHeading } from "@lxcat/database/dist/cs/public";
import { Group, Stack, Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { useState } from "react";
import { ListItem } from "./ListItem";
import { ReactionSummary } from "./ReactionSummary";

interface Props {
  items: CrossSectionHeading[];
}

export function List({ items }: Props) {
  return (
    <div style={{ display: "flex", gap: "1em", flexWrap: "wrap" }} role="list">
      {items.map((d) => <ListItem key={d.id} {...d} />)}
    </div>
  );
}

export const CSTable = ({ items }: Props) => {
  const [expandedSets, setExpandedSets] = useState<Array<string>>([]);

  const sets = [
    ...new Map(
      items.flatMap(({ isPartOf }) => isPartOf.map((set) => [set.name, set])),
    ).values(),
  ];

  const records = sets.map((set, id) => ({
    id,
    ...set,
    cs: items.filter(({ isPartOf }) =>
      isPartOf.map(({ name }) => name).includes(set.name)
    ).map((
      { isPartOf, ...item },
    ) => ({
      ...item,
      typeTags: item.reaction.type_tags,
      reaction: <ReactionSummary {...item.reaction} />,
    })),
  }));

  return (
    <DataTable
      withBorder
      borderRadius="md"
      withColumnBorders
      highlightOnHover
      columns={[
        { accessor: "organization", title: "Contributor" },
        { accessor: "name", title: "Set" },
        {
          accessor: "version",
          title: "Version",
          render: (record) => record.versionInfo.version,
        },
        {
          accessor: "complete",
          render: ({ complete }) => complete ? "True" : "False",
        },
      ]}
      records={records}
      rowExpansion={{
        allowMultiple: true,
        expanded: {
          recordIds: expandedSets,
          onRecordIdsChange: setExpandedSets,
        },
        content: ({ record }) => (
          <Stack spacing={6}>
            <Group spacing={6} p="xs">
              <Text fw={700}>Description:</Text>
              <Text>{record.description}</Text>
            </Group>
            <DataTable
              // noHeader
              withColumnBorders
              // height={200}
              highlightOnHover={false}
              columns={[
                { accessor: "id" },
                { accessor: "reaction" },
                {
                  accessor: "typeTags",
                  title: "Type",
                  render: (record) => record.typeTags.join(", "),
                },
              ]}
              records={record.cs}
            />
          </Stack>
        ),
      }}
    />
  );
};
