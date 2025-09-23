"use client";

import { Center, Group, Loader, Stack } from "@mantine/core";
import dynamic from "next/dynamic";
import { useState } from "react";
import { DenormalizedProcess } from "../denormalized-process";
import { colorScheme } from "./colors";
import { ProcessTable } from "./process-table";

const Chart = dynamic(
  async () => import("./process-plot").then((module) => module.ProcessPlot),
  {
    loading: () => (
      <Center style={{ width: 700, height: 600 }}>
        <Loader />
      </Center>
    ),
    ssr: false,
  },
);

export const PlotPanel = (
  { processes, referenceMarkers }: {
    processes: Array<DenormalizedProcess>;
    referenceMarkers: Map<string, number>;
  },
) => {
  const colorMap = new Map(
    processes.map((
      { info: { _key: id } },
      index,
    ) => [id, colorScheme[index % colorScheme.length]]),
  );

  const [selected, setSelected] = useState<Array<DenormalizedProcess>>(
    processes.slice(0, 5),
  );

  return (
    <Stack align="center" justify="center">
      <Chart
        processes={selected}
        colors={selected.map(({ info: { _key: id } }) => colorMap.get(id)!)}
      />
      <ProcessTable
        processes={processes}
        referenceMarkers={referenceMarkers}
        colorMap={colorMap}
        selected={selected}
        onChangeSelected={setSelected}
      />
    </Stack>
  );
};
