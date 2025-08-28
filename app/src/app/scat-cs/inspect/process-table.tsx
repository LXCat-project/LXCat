// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReferenceRef } from "@lxcat/schema/reference";
import { Group, HoverCard, MultiSelect, Stack, Text } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";
import { reactionAsLatex } from "../../../cs/reaction";
import { Latex } from "../../../shared/latex";
import { DenormalizedProcess } from "../denormalized-process";
import classes from "./process-table.module.css";

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

export const ProcessTable = (
  { processes, referenceMarkers, colorMap, selected, onChangeSelected }:
    ProcessTableProps,
) => {
  const [records, setRecords] = useState(processes);
  const [selectedTags, setSelectedTags] = useState<Array<string>>([]);

  const availableTags = useMemo(
    () => [...new Set(records.flatMap(({ reaction }) => reaction.typeTags))],
    [records],
  );

  useEffect(() => {
    setRecords(processes.filter((process) => {
      if (
        selectedTags.length
        && !process.reaction.typeTags.some((tag) => selectedTags.includes(tag))
      ) return false;

      return true;
    }));
  }, [processes, selectedTags]);

  return (
    <DataTable
      withTableBorder
      withColumnBorders
      borderRadius="md"
      idAccessor="info._key"
      className={classes.table}
      records={records}
      columns={[{
        accessor: "reaction",
        render: (record) => <Latex>{reactionAsLatex(record.reaction)}</Latex>,
      }, {
        accessor: "type",
        title: "Type",
        render: ({ reaction }) => reaction.typeTags.join(", "),
        filter: (
          <MultiSelect
            label="Type tags"
            description="Show all processes that are of one of the selected types"
            data={availableTags}
            value={selectedTags}
            onChange={setSelectedTags}
            leftSection={<IconSearch size={16} />}
            clearable
            searchable
          />
        ),
        filtering: true,
      }, {
        accessor: "database",
        title: "Database",
        render: ({ info: { isPartOf } }) => isPartOf[0].contributor.name,
      }, {
        accessor: "set",
        title: "Set",
        render: ({ info: { isPartOf } }) => isPartOf[0].name,
      }, {
        accessor: "reference",
        title: "Source",
        render: ({ info: { references } }) =>
          renderReferences(references, referenceMarkers),
      }]}
      selectedRecords={selected}
      onSelectedRecordsChange={onChangeSelected}
      getRecordSelectionCheckboxProps={({ info: { _key } }) => ({
        color: colorMap.get(_key),
        className: classes.checkbox,
      })}
    />
  );
};
