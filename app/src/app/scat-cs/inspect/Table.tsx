// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { ScrollArea, Table } from "@mantine/core";
import clsx from "clsx";
import { useState } from "react";
import classes from "./table.module.css";

export type TableRow = { key: string } & Record<string, React.ReactNode>;

export interface GenericTableProps<Row extends TableRow> {
  data: Array<Row>;
  headers: Array<{ label: React.ReactNode; key: keyof Row }>;
  maxHeight?: number | string;
}

export function TableScrollArea<Row extends TableRow>(
  { data, headers, maxHeight }: GenericTableProps<Row>,
) {
  const [scrolled, setScrolled] = useState(false);

  const rows = data.map((row) => (
    <tr key={row.key}>
      {headers.map(({ key }) => (
        <td key={`${String(key)}-${row.key}`}>{row[key]}</td>
      ))}
    </tr>
  ));

  return (
    <div style={{ maxHeight: maxHeight ?? 300 }}>
      <ScrollArea
        className={classes.outer}
        onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
      >
        <Table
          style={{
            // minWidth: 700
          }}
        >
          <thead
            className={clsx(classes.header, { [classes.scrolled]: scrolled })}
          >
            <tr>
              {headers.map(({ key, label }) => (
                <th key={String(key)}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </ScrollArea>
    </div>
  );
}
