"use client";

import { useState } from 'react';
import { createStyles, Table, ScrollArea } from '@mantine/core';

const useStyles = createStyles((theme) => ({
  header: {
    position: 'sticky',
    top: 0,
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    transition: 'box-shadow 150ms ease',

    zIndex: 1,

    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[2]
        }`,
    },
  },

  scrolled: {
    boxShadow: theme.shadows.sm,
  },

  outer: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[4],
    borderStyle: "solid",
  },
}));

export type TableRow = { key: string } & Record<string, React.ReactNode>;

export interface GenericTableProps<Row extends TableRow> {
  data: Array<Row>;
  headers: Array<{ label: React.ReactNode, key: keyof Row }>;
}

export function TableScrollArea<Row extends TableRow>({ data, headers }: GenericTableProps<Row>) {
  const { classes, cx } = useStyles();
  const [scrolled, setScrolled] = useState(false);

  const rows = data.map((row) => (
    <tr key={row.key}>
      {headers.map(({ key }) => <td key={`${String(key)}-${row.key}`}>{row[key]}</td>)}
    </tr>
  ));

  return (
    <ScrollArea className={classes.outer} sx={{ height: 300 }} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
      <Table sx={{ minWidth: 700 }}>
        <thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
          <tr>
            {headers.map(({ key, label }) => <th key={String(key)}>{label}</th>)}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </ScrollArea>
  );
}