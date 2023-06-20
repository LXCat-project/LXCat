// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MultiSelect } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";
import { reactionAsLatex } from "../../../ScatteringCrossSection/reaction";
import { Latex } from "../../../shared/Latex";
import { Process } from "./PlotPage";

export type ProcessTableProps = {
  processes: Array<Process>;
  referenceMarkers: Map<string, number>;
  colorMap: Map<string, string>;
  selected: Array<Process>;
  onChangeSelected: (selected: Array<Process>) => void;
};

export const ProcessTable = (
  { processes, referenceMarkers, colorMap, selected, onChangeSelected }:
    ProcessTableProps,
) => {
  const [records, setRecords] = useState(processes);
  const [selectedTags, setSelectedTags] = useState<Array<string>>([]);

  const availableTags = useMemo(
    () => [...new Set(records.flatMap(({ reaction }) => reaction.type_tags))],
    [],
  );

  useEffect(() => {
    setRecords(processes.filter((process) => {
      if (
        selectedTags.length
        && !process.reaction.type_tags.some((tag) => selectedTags.includes(tag))
      ) return false;

      return true;
    }));
  }, [selectedTags]);

  return (
    <DataTable
      withBorder
      withColumnBorders
      borderRadius="md"
      sx={{ ".mantine-ScrollArea-viewport": { maxHeight: 400 } }}
      records={records}
      columns={[{
        accessor: "reaction",
        render: (record) => <Latex>{reactionAsLatex(record.reaction)}</Latex>,
      }, {
        accessor: "type",
        title: "Type",
        render: ({ reaction }) => reaction.type_tags.join(", "),
        filter: (
          <MultiSelect
            label="Type tags"
            description="Show all processes that are of one of the selected types"
            data={availableTags}
            value={selectedTags}
            onChange={setSelectedTags}
            icon={<IconSearch size={16} />}
            clearable
            searchable
          />
        ),
        filtering: true,
      }, {
        accessor: "isPartOf",
        title: "Contributor",
        render: ({ isPartOf }) => isPartOf[0].organization,
      }, {
        accessor: "isPartOf",
        title: "Set",
        render: ({ isPartOf }) => isPartOf[0].name,
      }, {
        accessor: "reference",
        title: "Source",
        render: ({ reference }) =>
          `[${
            reference.map((rid) => referenceMarkers.get(rid)!).sort().join(
              ", ",
            )
          }]`,
      }]}
      selectedRecords={selected}
      onSelectedRecordsChange={onChangeSelected}
      getRecordSelectionCheckboxProps={({ id }) => ({
        sx: {
          ".mantine-Checkbox-input:checked": {
            backgroundColor: colorMap.get(id),
          },
        },
      })}
    />
  );
};
