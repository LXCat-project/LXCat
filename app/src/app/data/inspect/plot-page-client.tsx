// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { FormattedReference } from "@/citation/formatted-reference";
import { FormattedReferenceLink as Reference } from "@/citation/formatted-reference-link";
import { annotateMixture } from "@/shared/annotate-mixture";
import { LTPMixture } from "@lxcat/schema";
import {
  Alert,
  Button,
  Center,
  Fieldset,
  Grid,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
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
import { groupsOf, membersOf, YGroup } from "./plot-groups";
import { ProcessTable } from "./process-table";
import { getReferencesForSelectionAction } from "./references-action";
import { isPlottable } from "./selection";
import { SetStats, SetTable } from "./set-table";
import { TermsOfUseCheck } from "./terms-of-use-check";

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

const referenceFileNames = {
  "csl-json": "LXCat_references.json",
  bibtex: "LXCat_references.bib",
  ris: "LXCat_references.ris",
} as const;

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

/** Download the content, or tell the user that it could not be produced. */
const download = async (
  failure: string,
  fileName: string,
  content: () => Promise<string>,
) => {
  let text;
  try {
    text = await content();
  } catch {
    notifications.show({
      color: "red",
      title: failure,
      message: "Try again, or select fewer cross sections.",
    });
    return;
  }
  downloadFile(text, fileName);
};

const NUM_LINES_INIT = 5;

const tabData = [
  { value: "CrossSection", label: "Cross Sections" },
  { value: "RateCoefficient", label: "Rate Coefficients" },
  { value: "EnergyRateCoefficient", label: "Energy Rate Coefficients" },
];

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

  // The plot groups per info type: y-axis groups (Two-body, Three-body,
  // …) that each contain x-axis groups (electron temperature, gas
  // temperature, …). Processes without an x axis (constants, expressions)
  // are members of their y-axis group and appear in the table and plot of
  // every x-axis group of it; a y-axis group without x-axis groups has no
  // plot and is only listed in the table.
  const groupsByType: Record<string, Array<YGroup>> = Object.fromEntries(
    infoTypes.map((type) => [
      type,
      groupsOf(processes.filter((process) => process.info.type === type)),
    ]),
  );

  const [segmentControl, setSegmentControl] = useState({
    dataType: infoTypes[0],
    yGroup: groupsByType[infoTypes[0]][0].key,
    // Undefined when the y-axis group has no tabulated data.
    xGroup: groupsByType[infoTypes[0]][0].xGroups[0]?.key as
      | string
      | undefined,
  });

  const [newSelected, setNewSelected] = useState<
    Record<string, Record<string, Record<string, Array<DenormalizedProcess>>>>
  >(Object.fromEntries(
    Object.entries(groupsByType).map(([type, yGroups]) => [
      type,
      Object.fromEntries(
        yGroups.map((yGroup) => [
          yGroup.key,
          Object.fromEntries(
            yGroup.xGroups.map((xGroup) => [
              xGroup.key,
              membersOf(xGroup, yGroup).filter(isPlottable).slice(
                0,
                NUM_LINES_INIT,
              ),
            ]),
          ),
        ]),
      ),
    ]),
  ));

  const [warningVisible, setWarningVisibility] = useState(true);

  // The current selection: the y group of the info type and, within it,
  // the x group (undefined when it has no tabulated data).
  const yGroups = groupsByType[segmentControl.dataType];
  const yGroup = yGroups.find(({ key }) => key === segmentControl.yGroup)!;
  const xGroup = segmentControl.xGroup === undefined
    ? undefined
    : yGroup.xGroups.find(({ key }) => key === segmentControl.xGroup);

  const tableProcesses = xGroup
    ? membersOf(xGroup, yGroup)
    : yGroup.axisAgnostic;
  // The selection of a group without tabulated data has no plot, so it is
  // inert; only the tabulated groups carry a selection.
  const selected = xGroup
    ? newSelected[segmentControl.dataType][yGroup.key][xGroup.key]
    : [];
  const onChangeSelected = (processes: Array<DenormalizedProcess>) => {
    if (xGroup) {
      setNewSelected({
        ...newSelected,
        [segmentControl.dataType]: {
          ...newSelected[segmentControl.dataType],
          [yGroup.key]: {
            ...newSelected[segmentControl.dataType][yGroup.key],
            [xGroup.key]: processes,
          },
        },
      });
    }
  };

  // A stable color per process, indexed within its x-axis group.
  const colorMap = new Map(
    Object.values(groupsByType).flatMap((yGroups) =>
      yGroups.flatMap((yGroup) =>
        yGroup.xGroups.flatMap((xGroup) =>
          membersOf(xGroup, yGroup).map((
            { info: { _key: id } },
            index,
          ) => [id, colorScheme[index % colorScheme.length]])
        )
      )
    ),
  );

  const referenceMarkers = new Map(
    refs.map(({ id }, index) => [id, index + 1]),
  );

  const idsString = processes.map(({ info: { _key: id } }) => id).join(",");

  const downloadReferences = async (format: keyof typeof referenceFileNames) =>
    download(
      "Could not download the references",
      referenceFileNames[format],
      () =>
        getReferencesForSelectionAction(
          format,
          processes.map(({ info: { _key: id } }) => id),
        ),
    );

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
              value={segmentControl.dataType}
              onChange={(dataType) =>
                setSegmentControl({
                  dataType,
                  yGroup: groupsByType[dataType][0].key,
                  xGroup: groupsByType[dataType][0].xGroups[0]?.key,
                })}
              data={tabData.filter((entry) => infoTypes.includes(entry.value))}
            />
            <Fieldset legend="Plot">
              <Stack>
                {yGroups.length > 1
                  && (
                    <SegmentedControl
                      value={segmentControl.yGroup}
                      onChange={(yGroup) =>
                        setSegmentControl({
                          dataType: segmentControl.dataType,
                          yGroup,
                          xGroup: yGroups.find(({ key }) => key === yGroup)!
                            .xGroups[0]?.key,
                        })}
                      data={yGroups.map(({ key, label }) => ({
                        value: key,
                        label,
                      }))}
                    />
                  )}
                {yGroup.xGroups.length > 1
                  && (
                    <SegmentedControl
                      value={segmentControl.xGroup}
                      onChange={(xGroup) =>
                        setSegmentControl({ ...segmentControl, xGroup })}
                      data={yGroup.xGroups.map(({ key, label }) => ({
                        value: key,
                        label,
                      }))}
                    />
                  )}
                {xGroup
                  ? (
                    <Chart
                      processes={selected}
                      colors={selected.map((
                        { info: { _key: id } },
                      ) => colorMap.get(id)!)}
                      range={[xGroup.xmin, xGroup.xmax]}
                      xlabel={xGroup.xlabel}
                      ylabel={xGroup.ylabel}
                    />
                  )
                  : (
                    <Text c="dimmed">
                      This group has no tabulated data to plot; see the table
                      below for its processes.
                    </Text>
                  )}
              </Stack>
            </Fieldset>
          </Stack>
        </Grid.Col>
        <Grid.Col span="auto">
          <Stack>
            <ProcessTable
              processes={tableProcesses}
              referenceMarkers={referenceMarkers}
              colorMap={colorMap}
              selected={selected}
              onChangeSelected={onChangeSelected}
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
                        link: () =>
                          download(
                            "Could not download the data",
                            "lxcat-data.txt",
                            () => toLegacyAction(data),
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
                    link: () => downloadReferences("csl-json"),
                    icon: <IconCodeDots stroke={1.5} />,
                  }, {
                    text: "Bibtex",
                    link: () => downloadReferences("bibtex"),
                    icon: <IconFileText stroke={1.5} />,
                  }, {
                    text: "RIS",
                    link: () => downloadReferences("ris"),
                    icon: <IconFileText stroke={1.5} />,
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
