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

const plotData = {
  "CrossSection": {
    xlabel: "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
    ylabel: "$\\text{Cross section} \\left(\\mathrm{m}^2\\right)$",
  },
  "RateCoefficient": {
    xlabel: "$\\text{Gas temperature }\\left(\\mathrm{K}\\right)$",
    ylabel: "$\\text{Rate Coefficient} \\left(\\mathrm{m^3/s}\\right)$",
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

  const [dataType, setDataType] = useState<string>(infoTypes[0]);

  const processMap = Object.fromEntries(
    infoTypes.map((kind) => [
      kind,
      processes.filter((process) => process.info.type == kind),
    ]),
  );

  const [selected, setSelected] = useState<
    Record<string, Array<DenormalizedProcess>>
  >(
    mapObject(
      processMap,
      ([type, processes]) => [type, processes.slice(0, NUM_LINES_INIT)],
    ),
  );

  const [warningVisible, setWarningVisibility] = useState(true);

  const colorMap = new Map(
    Object.values(processMap).flatMap((processes) =>
      processes.map((
        { info: { _key: id } },
        index,
      ) => [id, colorScheme[index % colorScheme.length]])
    ),
  );

  const referenceMarkers = new Map(
    refs.map(({ id }, index) => [id, index + 1]),
  );

  const idsString = processes.map(({ info: { _key: id } }) => id).join(",");
  const idsPath = processes.map(({ info: { _key: id } }) => id).join("/");

  // The compute button should only be available when every process is either
  // not from a complete set, or from a complete set whose items are all in the
  // selection.
  const canCompute = data.processes.flatMap(({ info }) => info).every((info) =>
    info.isPartOf.some((setKey) =>
      !data.sets[setKey].complete
      || setStats[setKey].selected === setStats[setKey].total
    )
  );

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
              value={dataType}
              onChange={setDataType}
              data={tabData.filter((entry) => infoTypes.includes(entry.value))}
            />
            <Chart
              processes={selected[dataType]}
              colors={selected[dataType].map(({ info: { _key: id } }) =>
                colorMap.get(id)!
              )}
              xlabel={plotData[dataType].xlabel}
              ylabel={plotData[dataType].ylabel}
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span="auto">
          <Stack>
            <ProcessTable
              processes={processMap[dataType]}
              referenceMarkers={referenceMarkers}
              colorMap={colorMap}
              selected={selected[dataType]}
              onChangeSelected={(processes) =>
                setSelected({ ...selected, [dataType]: processes })}
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
                  entries={[{
                    text: "JSON",
                    link: async () =>
                      downloadFile(
                        JSON.stringify(annotateMixture(data)),
                        "lxcat-data.json",
                      ),
                    icon: <IconCodeDots stroke={1.5} />,
                  }, {
                    text: "Plaintext",
                    link: async () =>
                      downloadFile(
                        await toLegacyAction(data),
                        "lxcat-data.txt",
                      ),
                    icon: <IconFileText stroke={1.5} />,
                  }]}
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
                        router.push(`/scat-cs/compute?ids=${idsString}`)}
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
