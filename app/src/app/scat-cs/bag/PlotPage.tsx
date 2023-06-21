// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { CrossSectionSet } from "@lxcat/database/dist/css/collections";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import {
  Alert,
  Button,
  Center,
  Grid,
  Group,
  Loader,
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
import { ButtonClipboard } from "./ButtonClipboard";
import { ButtonMultiDownload } from "./ButtonMultiDownload";
import { colorScheme } from "./colors";
import { ProcessTable } from "./ProcessTable";
import { Reference } from "./Reference";
import { TermsOfUseCheck } from "./TermsOfUseCheck";
import { FormattedReference } from "./types";

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

export interface Process extends LUT {
  id: string;
  reaction: Reaction<State>;
  isPartOf: Array<Omit<CrossSectionSet, "versionInfo">>;
  reference: Array<string>;
}

const NUM_LINES_INIT = 5;

export const PlotPage = (
  { processes, refs, setMismatch, permaLink }: {
    processes: Array<Process>;
    refs: Array<FormattedReference>;
    setMismatch: boolean;
    permaLink: string;
  },
) => {
  const router = useRouter();

  const [selected, setSelected] = useState<Array<Process>>(
    processes.slice(0, NUM_LINES_INIT),
  );

  const [warningVisible, setWarningVisibility] = useState(true);

  // TODO: Map a selected process to an available color instead of a fixed color.
  let colorMap = new Map(
    processes.map((
      { id },
      index,
    ) => [id, colorScheme[index % colorScheme.length]]),
  );

  let referenceMarkers = new Map(refs.map(({ id }, index) => [id, index + 1]));

  let idsString = processes.map(({ id }) => id).join(",");
  let idsPath = processes.map(({ id }) => id).join("/");

  return (
    <>
      {setMismatch && warningVisible && (
        <Alert
          sx={(theme) => ({
            margin: theme.spacing.xs,
          })}
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
        align="center"
        justify="center"
        sx={(theme) => ({ margin: theme.spacing.xs })}
      >
        <Grid.Col span="content">
          <Stack>
            <Chart
              processes={selected}
              colors={selected.map(({ id }) => colorMap.get(id)!)}
            />
            <Center>
              <Button.Group>
                <ButtonMultiDownload
                  entries={[{
                    text: "JSON",
                    link: `/api/scat-cs/bag?ids=${idsString}`,
                    icon: <IconCodeDots stroke={1.5} />,
                  }, {
                    text: "Plaintext",
                    link: `/api/scat-cs/bag/legacy?ids=${idsString}`,
                    icon: <IconFileText stroke={1.5} />,
                  }]}
                >
                  Download data
                </ButtonMultiDownload>
                <ButtonClipboard link={permaLink}>
                  Copy permalink
                </ButtonClipboard>
                <Button
                  size="md"
                  rightIcon={<IconCalculator size="1.2rem" stroke={1.5} />}
                  onClick={() =>
                    router.push(`/scat-cs/compute?ids=${idsString}`)}
                >
                  Compute
                </Button>
              </Button.Group>
            </Center>
          </Stack>
        </Grid.Col>
        <Grid.Col span="auto">
          <Stack>
            <ProcessTable
              processes={processes}
              referenceMarkers={referenceMarkers}
              colorMap={colorMap}
              selected={selected}
              onChangeSelected={setSelected}
            />
            <Stack>
              <DataTable
                withBorder
                borderRadius="md"
                sx={{ ".mantine-ScrollArea-viewport": { maxHeight: 300 } }}
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
              <Group position="center">
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
                    rightIcon={
                      <IconTableExport size={"1.05rem"} stroke={1.5} />
                    }
                  >
                    Export table
                  </Button>
                </Button.Group>
                <TermsOfUseCheck references={refs} permaLink={permaLink} />
              </Group>
            </Stack>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
};
