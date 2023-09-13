// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Center, Checkbox, Grid, Loader, Stack } from "@mantine/core";
import dynamic from "next/dynamic";
import { useState } from "react";
import { reactionAsLatex } from "../../../ScatteringCrossSection/reaction";
import { Latex } from "../../../shared/Latex";
import { DenormalizedProcess } from "../denormalized-process";
import { colorScheme } from "./colors";
import { TableScrollArea } from "./Table";

const Chart = dynamic(
  async () => import("./Chart").then((module) => module.Chart),
  {
    loading: () => (
      <Center style={{ width: 700, height: 600 }}>
        <Loader />
      </Center>
    ),
    ssr: false,
  },
);

const NUM_LINES_INIT = 5;

export const ProcessPlot = (
  { processes }: { processes: Array<DenormalizedProcess> },
) => {
  // TODO: Map a selected process to an available color instead of a fixed color.
  const [selected, setSelected] = useState(
    new Set<string>(
      processes.slice(0, NUM_LINES_INIT).map(process => process.id),
    ),
  );

  const toggleRow = (key: string) =>
    setSelected((selection) => (
      new Set(selection.delete(key) ? selection : selection.add(key))
    ));

  let colorSelection = processes.reduce<Array<string>>(
    (prev, process, index) => {
      if (selected.has(process.id)) {
        prev.push(colorScheme[index % colorScheme.length]);
      }
      return prev;
    },
    [],
  );

  return (
    <>
      <Grid>
        <Grid.Col span="content">
          <Chart
            processes={processes.filter(process => selected.has(process.id))}
            colors={colorSelection}
          />
        </Grid.Col>
        <Grid.Col span="auto">
          <Stack>
            <TableScrollArea
              headers={[{ key: "_check", label: "" }, {
                key: "reaction",
                label: "Reaction",
              }]}
              maxHeight={400}
              data={processes.map((process, index) => ({
                key: process.id,
                reaction: <Latex>{reactionAsLatex(process.reaction)}</Latex>,
                _check: (
                  <Checkbox
                    sx={{
                      ".mantine-Checkbox-input:checked": {
                        backgroundColor:
                          colorScheme[index % colorScheme.length],
                      },
                    }}
                    checked={selected.has(process.id)}
                    onChange={() => toggleRow(process.id)}
                  />
                ),
              }))}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
};
