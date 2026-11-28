// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReferenceRef } from "@lxcat/schema/reference";
import {
  ActionIcon,
  Box,
  Group,
  HoverCard,
  List,
  MultiSelect,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconEye, IconEyeClosed, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useMemo, useState } from "react";
import { PAGE_SIZE } from "../../../cs/constants";
import { reactionAsLatex } from "../../../cs/reaction";
import { Latex } from "../../../shared/latex";
import { DenormalizedProcess } from "../denormalized-process";
import { ExpandableInfo, expandableInfo } from "./expanded-info";
import classes from "./process-table.module.css";
import { isPlottable, toggleAll } from "./selection";

export type ProcessTableProps = {
  processes: Array<DenormalizedProcess>;
  referenceMarkers: Map<string, number>;
  colorMap: Map<string, string>;
  selected: Array<DenormalizedProcess>;
  onChangeSelected: (selected: Array<DenormalizedProcess>) => void;
};

const renderReferences = (
  references: Array<ReferenceRef<string>>,
  markers: Map<string, number>,
) => (
  <Group gap={1}>
    <Text size="sm">[</Text>
    {references
      .map((ref) =>
        typeof ref === "string"
          ? {
            id: ref,
            marker: markers.get(ref)!,
            comments: undefined,
          }
          : {
            id: ref.id,
            marker: markers.get(ref.id)!,
            comments: ref.comments,
          }
      )
      .sort((a, b) => a.marker - b.marker)
      .map(
        ({ id, marker, comments }, index) => {
          return (
            <HoverCard key={id} disabled={comments === undefined}>
              <HoverCard.Target>
                <Text size="sm" fw={comments && 700}>
                  {index + 1 < references.length ? `${marker},` : marker}
                </Text>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Stack gap="xs">
                  {comments?.map((comment, i) => (
                    <Text size="md" key={i}>{comment}</Text>
                  ))}
                </Stack>
              </HoverCard.Dropdown>
            </HoverCard>
          );
        },
      )}
    <Text size="sm">]</Text>
  </Group>
);

// The details of a process, shown when its row is expanded.
const Expanded = ({ info }: { info: ExpandableInfo }) => (
  <Box className={classes.nested}>
    {info.comments
      && (
        <>
          <Text fw={700}>Comments:</Text>
          <List type="unordered">
            {info.comments.map((comment, index) => (
              <List.Item key={index}>
                <Text>{comment}</Text>
              </List.Item>
            ))}
          </List>
        </>
      )}
    {info.constant
      && (
        <Group>
          <Text fw={700}>Value:</Text>
          <Text>{info.constant.value} {info.constant.unit}</Text>
        </Group>
      )}
    {info.expression
      && (
        <Group>
          <Text fw={700}>Expression:</Text>
          <Text ff="mono">{info.expression}</Text>
        </Group>
      )}
  </Box>
);

export const ProcessTable = (
  { processes, referenceMarkers, colorMap, selected, onChangeSelected }:
    ProcessTableProps,
) => {
  const [selectedTags, setSelectedTags] = useState<Array<string>>([]);
  const [expanded, setExpanded] = useState<Array<string>>([]);
  const [page, setPage] = useState(1);

  const [records, availableTags] = useMemo(() => {
    const records = processes.filter((process) => {
      if (
        selectedTags.length
        && !process.reaction.typeTags.some((tag) => selectedTags.includes(tag))
      ) return false;

      return true;
    });
    return [
      records,
      [...new Set(records.flatMap(({ reaction }) => reaction.typeTags))],
    ];
  }, [processes, selectedTags]);

  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // The header checkbox is about all the selectable records that match the
  // filters, not only the ones on the current page.
  const selectable = useMemo(
    () => records.filter(isPlottable),
    [records],
  );

  const nrSelected = useMemo(() => {
    const selectedKeys = new Set(selected.map(({ info: { _key } }) => _key));
    return selectable.filter(({ info: { _key } }) => selectedKeys.has(_key))
      .length;
  }, [selectable, selected]);

  return (
    <DataTable
      withTableBorder
      withColumnBorders
      borderRadius="md"
      idAccessor="info._key"
      className={classes.table}
      records={pageRecords}
      totalRecords={records.length}
      recordsPerPage={PAGE_SIZE}
      page={page}
      onPageChange={setPage}
      paginationSize="sm"
      paginationText={({ from, to, totalRecords }) =>
        `${from}–${to} of ${totalRecords}`}
      rowExpansion={{
        allowMultiple: true,
        expandable: ({ record: { info } }) =>
          expandableInfo(info) !== undefined,
        expanded: {
          recordIds: expanded,
          onRecordIdsChange: setExpanded,
        },
        content: ({ record: { info } }) => (
          <Expanded info={expandableInfo(info)!} />
        ),
      }}
      columns={[
        {
          accessor: "reaction",
          render: (record) => <Latex>{reactionAsLatex(record.reaction)}</Latex>,
        },
        {
          accessor: "data",
          title: "Data",
          width: 120,
          render: ({ info: { data } }) => <Text size="sm">{data.type}</Text>,
        },
        {
          accessor: "type",
          title: "Type",
          render: ({ reaction }) => reaction.typeTags.join(", "),
          filter: (
            <MultiSelect
              label="Type tags"
              description="Show all processes that are of one of the selected types"
              data={availableTags}
              value={selectedTags}
              onChange={(tags) => {
                setSelectedTags(tags);
                setPage(1);
              }}
              leftSection={<IconSearch size={16} />}
              clearable
              searchable
            />
          ),
          filtering: true,
        },
        {
          accessor: "database",
          title: "Database",
          render: ({ info: { isPartOf } }) => isPartOf[0].contributor.name,
        },
        {
          accessor: "set",
          title: "Set",
          render: ({ info: { isPartOf } }) => isPartOf[0].name,
        },
        {
          accessor: "reference",
          title: "Source",
          render: ({ info: { references } }) =>
            renderReferences(references ?? [], referenceMarkers),
        },
        {
          accessor: "actions",
          textAlign: "center",
          width: 80,
          render: ({ info }) => {
            if (expandableInfo(info) !== undefined) {
              return expanded.includes(info._key)
                ? (
                  <Tooltip label="Hide details">
                    <ActionIcon size="sm" variant="subtle">
                      <IconEyeClosed size={20} />
                    </ActionIcon>
                  </Tooltip>
                )
                : (
                  <Tooltip label="Show details">
                    <ActionIcon size="sm" variant="subtle">
                      <IconEye size={20} />
                    </ActionIcon>
                  </Tooltip>
                );
            }
          },
        },
      ]}
      selectedRecords={selected}
      onSelectedRecordsChange={onChangeSelected}
      isRecordSelectable={isPlottable}
      allRecordsSelectionCheckboxProps={{
        "aria-label": "Select all records",
        checked: selectable.length > 0 && nrSelected === selectable.length,
        indeterminate: nrSelected > 0 && nrSelected < selectable.length,
        onChange: () =>
          onChangeSelected(toggleAll(processes, selectable, selected)),
      }}
      getRecordSelectionCheckboxProps={(record) => {
        const { _key } = record.info;
        return isPlottable(record)
          ? { color: colorMap.get(_key), className: classes.checkbox }
          : {
            className: classes.checkboxDisabled,
            title: "Expression data cannot be plotted yet",
          };
      }}
    />
  );
};
