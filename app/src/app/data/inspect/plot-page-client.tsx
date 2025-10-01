// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { annotateMixture } from "@/shared/annotate-mixture";
import { mapObject } from "@/shared/utils";
import { LTPMixture } from "@lxcat/schema";
import {
  Alert,
  Button,
  Center,
  Grid,
  Group,
  Loader,
  SegmentedControl,
  Stack,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalculator,
  IconCodeDots,
  IconFileText,
  IconTableExport,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DenormalizedProcess } from "../denormalized-process";
import { ButtonClipboard } from "./button-clipboard";
import { ButtonMultiDownload } from "./button-multi-download";
import { colorScheme } from "./colors";
import classes from "./inspect.module.css";
import { toLegacyAction } from "./legacy-action";
import { ProcessTable } from "./process-table";
import { Reference } from "./reference";
import { SetStats, SetTable } from "./set-table";
import { TermsOfUseCheck } from "./terms-of-use-check";
import { FormattedReference } from "./types";

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

const downloadFile = (
  jsonString: string,
  fileName: string,
  type: string = "application/json",
) => {
  const file = new Blob([jsonString], { type });
  const element = document.createElement("a");
  element.href = URL.createObjectURL(file);
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  element.remove();
};

const NUM_LINES_INIT = 5;

const tabData = [
  { value: "CrossSection", label: "Cross Sections" },
  { value: "RateCoefficient", label: "Rate Coefficients" },
];

const plotData: Record<
  string,
  Record<string, { xlabel: string; ylabel: string }>
> = {
  "CrossSection": {
    "m^2": {
      xlabel: "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
      ylabel: "$\\text{Cross section} \\left(\\mathrm{m}^2\\right)$",
    },
  },
  "RateCoefficient": {
    "m^3/s": {
      xlabel: "$\\text{Gas temperature }\\left(\\mathrm{K}\\right)$",
      ylabel: "$\\text{Rate Coefficient} \\left(\\mathrm{m^3/s}\\right)$",
    },
    "m^6/s": {
      xlabel: "$\\text{Gas temperature }\\left(\\mathrm{K}\\right)$",
      ylabel: "$\\text{Rate Coefficient} \\left(\\mathrm{m^6/s}\\right)$",
    },
  },
};

const getUnitOfData = (process: DenormalizedProcess) => {
  switch (process.info.data.type) {
    case "Constant":
      return process.info.data.unit;
    case "ExtendedArrhenius":
      const numConsumed = process
        .reaction.lhs
        .map(({ count }) => count).reduce((a, b) => a + b, 0);
      return `m^${3 * (numConsumed - 1)}/s`;
    case "LUT":
      return process.info.data.units[1];
  }
};

const unitSegmentLabelMap: Record<string, Record<string, string>> = {
  "CrossSection": {
    "m^2": "m^2",
  },
  "RateCoefficient": {
    "m^3/s": "Two-body",
    "m^6/s": "Three-body",
  },
};

export const PlotPageClient = (
  { processes, refs, setStats, setMismatch, data, permaLink, forceTermsOfUse }:
    {
      processes: Array<DenormalizedProcess>;
      refs: Array<FormattedReference>;
      setStats: SetStats;
      setMismatch: boolean;
      data: LTPMixture;
      permaLink: string;
      forceTermsOfUse?: boolean;
    },
) => {
  const router = useRouter();

  const infoTypes: Array<string> = [
    ...new Set(processes.map((process) => process.info.type)),
  ];

  const unitTypes: Record<string, Array<string>> = Object.fromEntries(
    infoTypes.map((
      type,
    ) => [type, [
      ...new Set(
        processes.filter((process) => process.info.type === type).map(
          getUnitOfData,
        ),
      ),
    ]]),
  );

  const processMap: Record<
    string,
    Record<string, Array<DenormalizedProcess>>
  > = Object.fromEntries(
    infoTypes.map((kind) => [
      kind,
      Object.fromEntries(
        unitTypes[kind].map((
          unitType,
        ) => [
          unitType,
          processes.filter((process) =>
            process.info.type === kind && getUnitOfData(process) === unitType
          ),
        ]),
      ),
    ]),
  );

  const [segmentControl, setSegmentControl] = useState({
    dataType: infoTypes[0],
    unitType: unitTypes[infoTypes[0]][0],
  });

  const [newSelected, setNewSelected] = useState<
    Record<string, Record<string, Array<DenormalizedProcess>>>
  >(mapObject(
    processMap,
    (
      [key, map],
    ) => [
      key,
      mapObject(
        map,
        ([key, processes]) => [key, processes.slice(0, NUM_LINES_INIT)],
      ),
    ],
  ));

  const [warningVisible, setWarningVisibility] = useState(true);

  const colorMap = new Map(
    Object.values(processMap).flatMap((map) => Object.values(map)).flatMap(
      processes =>
        processes.map((
          { info: { _key: id } },
          index,
        ) => [id, colorScheme[index % colorScheme.length]]),
    ),
  );

  const referenceMarkers = new Map(
    refs.map(({ id }, index) => [id, index + 1]),
  );

  const idsString = processes.map(({ info: { _key: id } }) => id).join(",");
  const idsPath = processes.map(({ info: { _key: id } }) => id).join("/");

  // Disable the compute button on ChemCat.
  const canCompute = false;

  return (
    <>
      {setMismatch && warningVisible && (
        <Alert
          className={classes.smallMargin}
          icon={<IconAlertCircle />}
          title="Mismatch in selected data!"
          color="orange"
          withCloseButton
          onClose={() => setWarningVisibility(false)}
        >
          The current selection contains cross sections from both complete, and
          incomplete sets.
        </Alert>
      )}
      <Grid
        justify="center"
        className={classes.smallMargin}
      >
        <Grid.Col span="content">
          <Stack>
            <SegmentedControl
              className={infoTypes.length > 1 ? "" : classes.hidden}
              value={segmentControl.dataType}
              onChange={(dataType) =>
                setSegmentControl({
                  dataType,
                  unitType: unitTypes[dataType][0],
                })}
              data={tabData.filter((entry) => infoTypes.includes(entry.value))}
            />
            <SegmentedControl
              className={unitTypes[segmentControl.dataType].length > 1
                ? ""
                : classes.hidden}
              value={segmentControl.unitType}
              onChange={(unitType) =>
                setSegmentControl({ ...segmentControl, unitType })}
              data={unitTypes[segmentControl.dataType].map((unit) => ({
                value: unit,
                label: unitSegmentLabelMap[segmentControl.dataType][unit],
              }))}
            />
            <Chart
              processes={newSelected[segmentControl.dataType][
                segmentControl.unitType
              ]}
              colors={newSelected[segmentControl.dataType][
                segmentControl.unitType
              ].map((
                { info: { _key: id } },
              ) => colorMap.get(id)!)}
              xlabel={plotData[segmentControl.dataType][segmentControl.unitType]
                .xlabel}
              ylabel={plotData[segmentControl.dataType][segmentControl.unitType]
                .ylabel}
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span="auto">
          <Stack>
            <ProcessTable
              processes={processMap[segmentControl.dataType][
                segmentControl.unitType
              ]}
              referenceMarkers={referenceMarkers}
              colorMap={colorMap}
              selected={newSelected[segmentControl.dataType][
                segmentControl.unitType
              ]}
              onChangeSelected={(processes) =>
                setNewSelected({
                  ...newSelected,
                  [segmentControl.dataType]: {
                    ...newSelected[segmentControl.dataType],
                    [segmentControl.unitType]: processes,
                  },
                })}
            />
            <SetTable
              sets={data.sets}
              stats={setStats}
              referenceMarkers={referenceMarkers}
            />
            <DataTable
              withTableBorder
              borderRadius="md"
              className={classes.scrollableTable}
              records={refs}
              columns={[{
                accessor: "marker",
                title: "",
                render: ({ id }) => referenceMarkers.get(id)!,
              }, {
                accessor: "ref",
                title: "Reference",
                render: (ref) => <Reference>{ref}</Reference>,
              }]}
            />
            <Group justify="center">
              <Button.Group>
                <ButtonMultiDownload
                  entries={[
                    {
                      text: "JSON",
                      link: async () =>
                        downloadFile(
                          JSON.stringify(annotateMixture(data)),
                          "lxcat-data.json",
                        ),
                      icon: <IconCodeDots stroke={1.5} />,
                    },
                    ...(infoTypes.length === 1 && infoTypes[0] == "CrossSection"
                      ? [{
                        text: "Plaintext",
                        link: async () =>
                          downloadFile(
                            await toLegacyAction(data),
                            "lxcat-data.txt",
                          ),
                        icon: <IconFileText stroke={1.5} />,
                      }]
                      : []),
                  ]}
                >
                  Download data
                </ButtonMultiDownload>
                <ButtonClipboard link={permaLink}>
                  Copy permalink
                </ButtonClipboard>
                {canCompute
                  && (
                    <Button
                      size="md"
                      rightSection={
                        <IconCalculator size="1.2rem" stroke={1.5} />
                      }
                      onClick={() =>
                        router.push(`/data/compute?ids=${idsString}`)}
                    >
                      Compute
                    </Button>
                  )}
              </Button.Group>
              <Button.Group>
                <ButtonMultiDownload
                  entries={[{
                    text: "CSL-JSON",
                    link: `/api/references/csl-json/for-selection/${idsPath}`,
                    icon: <IconCodeDots stroke={1.5} />,
                    fileName: "LXCat_references",
                  }, {
                    text: "Bibtex",
                    link: `/api/references/bibtex/for-selection/${idsPath}`,
                    icon: <IconFileText stroke={1.5} />,
                    fileName: "LXCat_references.bib",
                  }, {
                    text: "RIS",
                    link: `/api/references/ris/for-selection/${idsPath}`,
                    icon: <IconFileText stroke={1.5} />,
                    fileName: "LXCat_references.ris",
                  }]}
                >
                  Download references
                </ButtonMultiDownload>
                <Button
                  variant="light"
                  size="md"
                  disabled
                  rightSection={
                    <IconTableExport size={"1.05rem"} stroke={1.5} />
                  }
                >
                  Export table
                </Button>
              </Button.Group>
              <TermsOfUseCheck
                references={refs}
                permaLink={permaLink}
                forceOpen={forceTermsOfUse}
              />
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
};
