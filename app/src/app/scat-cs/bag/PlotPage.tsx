// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { State } from "@lxcat/database/dist/shared/types/collections";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import {
  Alert,
  Button,
  Center,
  Checkbox,
  Grid,
  Group,
  Loader,
  Stack,
} from "@mantine/core";
import { IconAlertCircle, IconCodeDots, IconFileText } from "@tabler/icons";
import dynamic from "next/dynamic";
import { useState } from "react";
import { reactionAsLatex } from "../../../ScatteringCrossSection/reaction";
import { Latex } from "../../../shared/Latex";
import { ButtonClipboard } from "./ButtonClipboard";
import { ButtonMultiDownload } from "./ButtonMultiDownload";
import { colorScheme } from "./colors";
import { ReferenceList } from "./ReferenceList";
import { TableScrollArea } from "./Table";
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

interface Process extends LUT {
  id: string;
  reaction: Reaction<State>;
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
  // TODO: Map a selected process to an available color instead of a fixed color.
  const [selected, setSelected] = useState(
    new Set<string>(
      processes.slice(0, NUM_LINES_INIT).map(process => process.id),
    ),
  );

  const [warningVisible, setWarningVisibility] = useState(true);

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

  let idsString = processes.map(({ id }) => id).join(",");
  let referenceIds = refs.map(({ id }) => id).join("/");

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
              processes={processes.filter(process => selected.has(process.id))}
              colors={colorSelection}
            />
            <Center>
              <Button.Group>
                <ButtonMultiDownload
                  entries={[{
                    text: "JSON",
                    link: `/api/scat-cs/bag?ids=${idsString}`,
                    icon: <IconCodeDots stroke={1.5} />,
                  }, {
                    // TODO: Add option to download Bolsig+ format for arbitrary selections.
                    text: "Plaintext",
                    link: "",
                    icon: <IconFileText stroke={1.5} />,
                    disabled: true,
                  }]}
                >
                  Download data
                </ButtonMultiDownload>
                <ButtonClipboard link={permaLink}>
                  Copy permalink
                </ButtonClipboard>
              </Button.Group>
            </Center>
          </Stack>
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
            <Stack>
              <ReferenceList references={refs} />
              <Group position="center">
                <ButtonMultiDownload
                  entries={[{
                    text: "CSL-JSON",
                    link: `/api/references/csl-json/${referenceIds}`,
                    icon: <IconCodeDots stroke={1.5} />,
                    fileName: "LXCat_references",
                  }, {
                    text: "Bibtex",
                    link: `/api/references/bibtex/${referenceIds}`,
                    icon: <IconFileText stroke={1.5} />,
                    fileName: "LXCat_references.bib",
                  }, {
                    text: "RIS",
                    link: `/api/references/ris/${referenceIds}`,
                    icon: <IconFileText stroke={1.5} />,
                    fileName: "LXCat_references.ris",
                  }]}
                >
                  Download references
                </ButtonMultiDownload>
                <TermsOfUseCheck references={refs} permaLink={permaLink} />
              </Group>
            </Stack>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
};
