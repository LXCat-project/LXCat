"use client";

import { Checkbox } from "@mantine/core";
import { useState } from "react";
import { GenericTableProps, TableRow, TableScrollArea } from "./Table";

// TODO: Checkbox passes over header when scrolling.
export const TableSelectable = <Row extends TableRow>(
  { data, headers }: GenericTableProps<Row>,
) => {
  const [selected, setSelected] = useState(new Set<Row["key"]>());

  const toggleRow = (key: Row["key"]) =>
    setSelected((selection) => (
      new Set(selection.delete(key) ? selection : selection.add(key))
    ));

  return (
    <TableScrollArea
      headers={[{ key: "_check", label: "" }, ...headers]}
      data={data.map((row) => ({
        ...row,
        _check: (
          <Checkbox
            checked={selected.has(row.key)}
            onChange={() => toggleRow(row.key)}
          />
        ),
      }))}
    />
  );
};
