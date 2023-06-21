// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionHeading } from "@lxcat/database/dist/cs/public";
import { createStyles, Group, Stack, Text } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Reference } from "../shared/Reference";
import { ReactionSummary } from "./ReactionSummary";

const useStyles = createStyles(() => ({
  expandIcon: {
    transition: "transform 0.2s ease",
  },
  expandIconRotated: {
    transform: "rotate(90deg)",
  },
  header: {
    "& th": {
      backgroundColor: "white",
    },
  },
}));

interface Props {
  items: CrossSectionHeading[];
}

export const CSTable = ({ items }: Props) => {
  const [expandedSets, setExpandedSets] = useState<Array<string>>([]);
  const router = useRouter();
  const { cx, classes } = useStyles();

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
      highlightOnHover
      columns={[
        {
          accessor: "organization",
          title: "Database",
          render: ({ id, organization }) => (
            <Group spacing="xs">
              <IconChevronRight
                size="0.9em"
                className={cx(classes.expandIcon, {
                  [classes.expandIconRotated]: expandedSets.includes(id),
                })}
              />
              <Text>{organization}</Text>
            </Group>
          ),
        },
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
              { backgroundColor: theme.colors.gray[0], padding: 10 }
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
              withColumnBorders
              withBorder
              borderRadius="md"
              classNames={{ header: classes.header }}
              sx={{ ".mantine-ScrollArea-viewport": { maxHeight: 300 } }}
              highlightOnHover={false}
              columns={[
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
