// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Contributor } from "@lxcat/schema";
import { ActionIcon, Box, Center, Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import Link from "next/link";
import { useState } from "react";

import { IconExternalLink } from "@tabler/icons-react";
import classes from "./contributor-table.module.css";

export const ContributorTable = (
  { contributors }: { contributors: Array<Contributor> },
) => {
  const [expanded, setExpanded] = useState<Array<string>>([]);

  return (
    <DataTable
      withTableBorder
      height={600}
      borderRadius="sm"
      records={contributors}
      idAccessor="name"
      columns={[
        { accessor: "name" },
        { accessor: "contact" },
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
