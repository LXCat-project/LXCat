"use client";

import { State } from "@lxcat/database/dist/shared/types/collections";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { Checkbox } from "@mantine/core";
import { useState } from "react";
import { reactionAsLatex } from "../../../ScatteringCrossSection/reaction";
import { colorScheme } from "../../../ScatteringCrossSectionSet/ProcessList";
import { Latex } from "../../../shared/Latex";
import { LutPlots } from "./PlotCanvas";
import { TableScrollArea } from "./Table";

interface Process extends LUT {
  id: string;
  reaction: Reaction<State>;
}

export const ProcessPlot = (
  { processes }: { processes: Array<Process> },
) => {
  // TODO: Map a selected process to an available color.
  const [selected, setSelected] = useState(new Set<string>());

  const toggleRow = (key: string) =>
    setSelected((selection) => (
      new Set(selection.delete(key) ? selection : selection.add(key))
    ));

  let colorSelection = processes.reduce<Array<string>>((prev, process, index) => {
    if (selected.has(process.id)) {
      prev.push(colorScheme[index % colorScheme.length]);
    }
    return prev;
  }, []);

  return (
    <>
      <LutPlots
        processes={processes.filter(process => selected.has(process.id))}
        colors={colorSelection}
      />
      <TableScrollArea
        headers={[{ key: "_check", label: "" }, {
          key: "reaction",
          label: "Reaction",
        }]}
        data={processes.map((process, index) => ({
          key: process.id,
          reaction: <Latex>{reactionAsLatex(process.reaction)}</Latex>,
          _check: (
            <Checkbox
              sx={{".mantine-Checkbox-input:checked": {backgroundColor: colorScheme[index % colorScheme.length]}}}
              checked={selected.has(process.id)}
              onChange={() => toggleRow(process.id)}
            />
          ),
        }))}
      />
    </>
  );
};
