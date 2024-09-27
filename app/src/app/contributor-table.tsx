// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { ActionIcon, Box, Center, Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import Link from "next/link";
import { useState } from "react";

import { IconChevronRight, IconExternalLink } from "@tabler/icons-react";
import clsx from "clsx";
import { ContributorWithStats } from "../../../packages/database/dist/auth/queries";
import classes from "./contributor-table.module.css";

export const ContributorTable = (
  { contributors }: { contributors: Array<ContributorWithStats> },
) => {
  const [expanded, setExpanded] = useState<Array<string>>([]);

  return (
    <DataTable
      withTableBorder
      height={800}
      borderRadius="sm"
      highlightOnHover
      records={contributors}
      idAccessor="name"
      columns={[
        {
          accessor: "name",
          width: 180,
          render: ({ name }) => (
            <>
              <IconChevronRight
                className={clsx(classes.icon, classes.expandIcon, {
                  [classes.expandIconRotated]: expanded.includes(name),
                })}
              />
              <span>{name}</span>
            </>
          ),
        },
        { accessor: "contact" },
        { accessor: "nSets", title: "# converted sets", textAlign: "center" },
        {
          accessor: "link",
          title: "LXCat 2 link",
          render: ({ name }) => (
            <Center>
              <Link
                href={`https://lxcat.net/${name}`}
                passHref
                legacyBehavior
              >
                <ActionIcon
                  component="a"
                  target="_blank"
                  size="sm"
                  variant="subtle"
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconExternalLink />
                </ActionIcon>
              </Link>
            </Center>
          ),
        },
      ]}
      rowExpansion={{
        allowMultiple: true,
        expanded: { recordIds: expanded, onRecordIdsChange: setExpanded },
        content: ({ record }) => (
          <Box className={classes.nested}>
            <Text fw={700}>How to reference:</Text>
            <Text>{record.howToReference}</Text>
            <Text fw={700}>Description:</Text>
            <Text>{record.description}</Text>
          </Box>
        ),
      }}
    />
  );
};
