// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import classes from "./cs-table.module.css";

import { Reference } from "@/citation/reference";
import { CrossSectionHeading } from "@lxcat/database/item";
import { Anchor, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChevronRight } from "@tabler/icons-react";
import clsx from "clsx";
import { DataTable } from "mantine-datatable";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PAGE_SIZE } from "./constants";
import { MatchingSet } from "./matching-set";
import { ReactionSummary } from "./reaction-summary";

interface Props {
  sets: Array<MatchingSet>;
  loading: boolean;
  /** Load a page, counted from 1, of the cross sections of a set. */
  loadItems: (
    setKey: string,
    page: number,
  ) => Promise<Array<CrossSectionHeading>>;
}

/**
 * The sets that match a search, which show their cross sections when they are
 * expanded, a page at a time.
 *
 * The table forgets what it loaded when it is created again, which is what the
 * search page does when the selection changes.
 */
export const CSTable = ({ sets, loading, loadItems }: Props) => {
  const [expandedSets, setExpandedSets] = useState<Array<string>>([]);
  const [pages, setPages] = useState<Record<string, number>>({});
  // The cross sections that were loaded, by set and page.
  const [items, setItems] = useState<
    Record<string, Array<CrossSectionHeading>>
  >(
    {},
  );
  const [fetching, setFetching] = useState<Array<string>>([]);
  const router = useRouter();

  const load = async (setKey: string, page: number) => {
    setPages((pages) => ({ ...pages, [setKey]: page }));
    if (`${setKey}/${page}` in items) return;

    setFetching((fetching) => [...fetching, setKey]);
    try {
      const loaded = await loadItems(setKey, page);
      setItems((items) => ({ ...items, [`${setKey}/${page}`]: loaded }));
    } catch {
      notifications.show({
        color: "red",
        title: "Could not load the cross sections",
        message: "Collapse the set and expand it again to try again.",
      });
    } finally {
      setFetching((fetching) => {
        const index = fetching.indexOf(setKey);
        return fetching.filter((_, i) => i !== index);
      });
    }
  };

  return (
    <DataTable
      withTableBorder
      fetching={loading}
      borderRadius="sm"
      highlightOnHover
      minHeight={150}
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
        { accessor: "nrItems", title: "Cross sections" },
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
      records={sets}
      rowExpansion={{
        allowMultiple: true,
        expanded: {
          recordIds: expandedSets,
          onRecordIdsChange: (recordIds: Array<unknown>) => {
            // The ids of the records are the keys of the sets.
            const ids = recordIds.filter((id): id is string =>
              typeof id === "string"
            );
            setExpandedSets(ids);
            ids.filter((id) => !expandedSets.includes(id)).forEach((id) =>
              load(id, pages[id] ?? 1)
            );
          },
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
              <Anchor component={Link} href={`/scat-css/${record.id}`}>
                Open the whole set
              </Anchor>
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
              records={(items[`${record.id}/${pages[record.id] ?? 1}`] ?? [])
                .map(({ isPartOf: _, ...item }) => ({
                  ...item,
                  typeTags: item.reaction.typeTags,
                  reaction: <ReactionSummary {...item.reaction} />,
                }))}
              fetching={fetching.includes(record.id)}
              minHeight={100}
              totalRecords={record.nrItems}
              recordsPerPage={PAGE_SIZE}
              page={pages[record.id] ?? 1}
              onPageChange={(page) => load(record.id, page)}
              paginationSize="sm"
              paginationText={({ from, to, totalRecords }) =>
                `${from}–${to} of ${totalRecords}`}
              onRowClick={({ record }) =>
                router.push(`/scat-cs/inspect?ids=${record.id}`)}
            />
          </Stack>
        ),
      }}
    />
  );
};
