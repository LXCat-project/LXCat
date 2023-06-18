// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionHeading } from "@lxcat/database/dist/cs/public";
import { Group, Stack, Text, useMantineTheme } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Reference } from "../shared/Reference";
import { ReactionSummary } from "./ReactionSummary";

interface Props {
  items: CrossSectionHeading[];
}

export const CSTable = ({ items }: Props) => {
  const [expandedSets, setExpandedSets] = useState<Array<string>>([]);
  const router = useRouter();
  const theme = useMantineTheme();

  const sets = [
    ...new Map(
      items.flatMap(({ isPartOf }) => isPartOf.map((set) => [set.name, set])),
    ).values(),
  ];

  const records = sets.map((set) => ({
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
      // withColumnBorders
      highlightOnHover
      rowStyle={({ id }) => (expandedSets.includes(id)
        ? {
          backgroundColor: theme.colors.gray[1],
          fontWeight: "bold",
        }
        : undefined)}
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
          <Stack
            spacing={3}
            sx={(theme) => (
              { backgroundColor: theme.colors.gray[1] }
            )}
          >
            <Stack spacing={3} p="xs">
              <Group spacing={6}>
                <Text fw={700}>Description:</Text>
                <Text>{record.description}</Text>
              </Group>
              <Group spacing={6}>
                <Text fw={700}>Published in:</Text>
                <Text>
                  {record.publishedIn
                    ? <Reference {...record.publishedIn} />
                    : "-"}
                </Text>
              </Group>
            </Stack>
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
              onRowClick={(record) => router.push(`/scat-cs/${record.id}`)}
            />
          </Stack>
        ),
      }}
    />
  );
};
