// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import classes from "./cs-table.module.css";

import { CrossSectionHeading } from "@lxcat/database/item";
import { Group, Stack, Text } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import clsx from "clsx";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Reference } from "../shared/reference";
import { ReactionSummary } from "./reaction-summary";

interface Props {
  items: CrossSectionHeading[];
}

export const CSTable = ({ items }: Props) => {
  const [expandedSets, setExpandedSets] = useState<Array<string>>([]);
  const router = useRouter();

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
      typeTags: item.reaction.typeTags,
      reaction: <ReactionSummary {...item.reaction} />,
    })),
  }));

  return (
    <DataTable
      withTableBorder
      borderRadius="md"
      highlightOnHover
      columns={[
        {
          accessor: "organization",
          title: "Database",
          render: ({ id, organization }) => (
            <Group gap="xs">
              <IconChevronRight
                size="0.9em"
                className={clsx(classes.expandIcon, {
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
            gap={3}
            className={classes.nestedBody}
          >
            <Stack gap={3} p="xs">
              <Group gap={6}>
                <Text fw={700}>Description:</Text>
                <Text>{record.description}</Text>
              </Group>
              <Group gap={6}>
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
              withTableBorder
              borderRadius="md"
              className={classes.nestedTable}
              highlightOnHover={true}
              columns={[
                { accessor: "reaction" },
                { accessor: "threshold", title: "Threshold (eV)" },
                {
                  accessor: "typeTags",
                  title: "Type",
                  render: (record) => record.typeTags.join(", "),
                },
              ]}
              records={record.cs}
              onRowClick={({ record }) =>
                router.push(`/scat-cs/inspect?ids=${record.id}`)}
            />
          </Stack>
        ),
      }}
    />
  );
};
