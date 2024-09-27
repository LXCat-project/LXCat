// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { LTPMixture } from "@lxcat/schema";
import { ActionIcon, Box, Text } from "@mantine/core";
import { IconChevronRight, IconExternalLink } from "@tabler/icons-react";
import clsx from "clsx";
import { DataTable } from "mantine-datatable";
import Link from "next/link";
import { useMemo, useState } from "react";

import classes from "./set-table.module.css";

export type SetStats = Record<string, { selected: number; total: number }>;

export const SetTable = (
  { sets, stats, referenceMarkers }: {
    sets: LTPMixture["sets"];
    stats: SetStats;
    referenceMarkers: Map<string, number>;
  },
) => {
  const setArray = useMemo(() => Object.values(sets), [sets]);

  const [expanded, setExpanded] = useState<Array<string>>(
    setArray.length === 1 ? [setArray[0]._key] : [],
  );

  return (
    <DataTable
      withTableBorder
      borderRadius="md"
      idAccessor="_key"
      highlightOnHover
      records={setArray}
      columns={[
        {
          accessor: "name",
          title: "Set name",
          width: 180,
          render: ({ name, _key }) => (
            <>
              <IconChevronRight
                className={clsx(classes.icon, classes.expandIcon, {
                  [classes.expandIconRotated]: expanded.includes(_key),
                })}
              />
              <span>{name}</span>
            </>
          ),
        },
        {
          accessor: "_key",
        },
        {
          accessor: "contributor",
          render: ({ contributor }) => contributor.name,
        },
        {
          accessor: "version",
          render: ({ versionInfo }) => versionInfo.version,
        },
        {
          accessor: "complete",
          render: ({ complete }) => complete ? "True" : "False",
        },
        {
          accessor: "publishedIn",
          render: ({ publishedIn }) =>
            publishedIn ? `[${referenceMarkers.get(publishedIn)}]` : "-",
        },
        {
          accessor: "stats",
          title: "Number of selected processes",
          render: ({ _key }) =>
            `${stats[_key].selected} / ${stats[_key].total}`,
        },
        {
          accessor: "link",
          render: ({ _key }) => (
            <Link
              href={`/scat-css/${_key}`}
              passHref
              legacyBehavior
            >
              <ActionIcon
                component="a"
                size="sm"
                variant="subtle"
                onClick={(event) => event.stopPropagation()}
              >
                <IconExternalLink />
              </ActionIcon>
            </Link>
          ),
        },
      ]}
      rowExpansion={{
        allowMultiple: true,
        expanded: { recordIds: expanded, onRecordIdsChange: setExpanded },
        content: ({ record }) => (
          <Box className={classes.nested}>
            <Text fw={700}>Description:</Text>
            <Text>{record.description}</Text>
          </Box>
        ),
      }}
    />
  );
};
