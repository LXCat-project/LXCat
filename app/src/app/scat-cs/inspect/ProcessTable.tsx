// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MultiSelect } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";
import { reactionAsLatex } from "../../../ScatteringCrossSection/reaction";
import { Latex } from "../../../shared/Latex";
import { DenormalizedProcess } from "../denormalized-process";
import classes from "./inspect.module.css";

export type ProcessTableProps = {
  processes: Array<DenormalizedProcess>;
  referenceMarkers: Map<string, number>;
  colorMap: Map<string, string>;
  selected: Array<DenormalizedProcess>;
  onChangeSelected: (selected: Array<DenormalizedProcess>) => void;
};

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
      className={classes.processTable}
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
        render: ({ info: { isPartOf } }) => isPartOf[0].contributor,
      }, {
        accessor: "set",
        title: "Set",
        render: ({ info: { isPartOf } }) => isPartOf[0].name,
      }, {
        accessor: "reference",
        title: "Source",
        render: ({ info: { references } }) =>
          `[${
            references.map((rid) => referenceMarkers.get(rid)!).sort().join(
              ", ",
            )
          }]`,
      }]}
      selectedRecords={selected}
      onSelectedRecordsChange={onChangeSelected}
      getRecordSelectionCheckboxProps={({ info: { _key } }) => ({
        color: colorMap.get(_key),
        className: classes.processCheckbox,
      })}
    />
  );
};
