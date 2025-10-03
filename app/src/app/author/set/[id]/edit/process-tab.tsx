// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MaybePromise } from "@/app/api/util";
import { ScientificInput } from "@/shared/scientific-input";
import { EditedLTPDocument } from "@lxcat/schema";
import { CrossSectionInfo, ReactionEntry } from "@lxcat/schema/process";
import { ReferenceRef } from "@lxcat/schema/reference";
import {
  Accordion,
  ActionIcon,
  Button,
  Center,
  Fieldset,
  ScrollArea,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconPlaylistAdd,
  IconRowInsertBottom,
  IconTrash,
} from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";
import Latex from "react-latex-next";
import { CommentSection } from "./comment-section";
import { LookupTable } from "./lookup-table";
import { ParameterSection } from "./parameter-section";
import classes from "./process-tab.module.css";
import { ReactionBuilder } from "./reaction-builder";
import { ReferenceSection } from "./reference-section";
import accordionClasses from "./top-level-accordion.module.css";

type Process = EditedLTPDocument["processes"][number];
type ProcessInfo = Process["info"][number];

function entryAsLatex(
  entry: ReactionEntry<string>,
  speciesMap: Record<string, string>,
) {
  if (entry.count === 1) {
    return speciesMap[entry.state];
  }
  return `${entry.count}${speciesMap[entry.state]}`;
}

function reactionAsLatex(
  reaction: Process["reaction"],
  speciesMap: Record<string, string>,
) {
  const lhs = reaction
    .lhs
    .map((entry) => entryAsLatex(entry, speciesMap))
    .join(" + ");

  const rhs = reaction
    .rhs
    .map((entry) => entryAsLatex(entry, speciesMap))
    .join(" + ");

  const arrow = reaction.reversible ? "\\leftrightarrow" : "\\rightarrow";

  return `${lhs} ${arrow} ${rhs}`;
}

const dataTypeLabels = {
  "LUT": "Lookup table",
  "Constant": "Constant",
  "ExtendedArrhenius": "Arrhenius",
};
const dataTypeSelectData = Object
  .entries(dataTypeLabels)
  .map(([value, label]) => ({ value, label }));

const DataEditComponent = (
  { data, onChange }: {
    data: ProcessInfo["data"];
    onChange: (data: ProcessInfo["data"]) => MaybePromise<void>;
  },
) => {
  switch (data.type) {
    case "LUT":
      return <LookupTable data={data} onChange={onChange} />;
    default:
      return (
        <Text>
          Editing of data of type {data.type} is not yet supported in the GUI.
        </Text>
      );
  }
};

const ProcessInfoData = (
  { data, onChange }: {
    data: ProcessInfo["data"];
    onChange: (data: ProcessInfo["data"]) => MaybePromise<void>;
  },
) => {
  return (
    <Stack gap="sm">
      <Select
        label="Type"
        allowDeselect={false}
        value={data.type}
        data={dataTypeSelectData}
      />
      <DataEditComponent data={data} onChange={onChange} />
    </Stack>
  );
};

const typeLabelMap = {
  "CrossSection": "Cross section",
  "RateCoefficient": "Rate coefficient",
};
const typeSelectData = Object
  .entries(typeLabelMap)
  .map(([value, label]) => ({ value, label }));

const ProcessInfoItem = (
  { id, info, references, onChange, onDelete }: {
    id: string;
    info: ProcessInfo;
    references: Record<string, string>;
    onChange: (info: ProcessInfo) => MaybePromise<void>;
    onDelete: () => MaybePromise<void>;
  },
) => {
  return (
    <Accordion.Item value={id}>
      <Center>
        <Accordion.Control>
          {typeLabelMap[info.type]}
        </Accordion.Control>
        <ActionIcon
          style={{ marginRight: 10 }}
          variant="subtle"
          color="red"
          onClick={onDelete}
        >
          <IconTrash />
        </ActionIcon>
      </Center>
      <Accordion.Panel>
        <Stack gap="sm">
          <Select
            label="Type"
            allowDeselect={false}
            value={info.type}
            data={typeSelectData}
          />
          <Fieldset legend="Comments">
            <CommentSection
              comments={info.comments}
              onChange={(comments) => onChange({ ...info, comments })}
            />
          </Fieldset>
          <Fieldset legend="References">
            <ReferenceSection
              selected={info.references}
              references={references}
              onChange={(references) => onChange({ ...info, references })}
            />
          </Fieldset>
          <ScientificInput
            label="Energy loss (eV)"
            value={info.threshold}
            onChange={(threshold) =>
              onChange({ ...info, threshold: threshold ?? 0 })}
          />
          <Fieldset legend="Data">
            <ProcessInfoData
              data={info.data}
              onChange={(data) => {
                console.log(data);
                // We need to cast to ProcessInfo here, as data is a union over
                // all different data types. Not all data types are compatible
                // with all different info types, but we know that the data type
                // that is provided here is always compatible with the provided
                // info type.
                return onChange({ ...info, data } as ProcessInfo);
              }}
            />
          </Fieldset>
          {info.type === "CrossSection"
            ? (
              <ParameterSection
                parameters={info.parameters}
                setParameters={(parameters) =>
                  onChange({ ...info, parameters })}
              />
            )
            : <></>}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

const defaultInfoItem = (): CrossSectionInfo<ReferenceRef<string>> => ({
  type: "CrossSection",
  references: [],
  threshold: 0,
  data: {
    type: "LUT",
    labels: ["Energy", "Cross Section"],
    units: ["eV", "m^2"],
    values: [[0, 0]],
  },
});

const ProcessItem = (
  {
    process,
    species,
    references,
    onChange,
    onDelete,
    itemValue,
    renderPanel = true,
  }: {
    process: Process;
    species: Record<string, string>;
    references: Record<string, string>;
    onChange: (process: Process) => MaybePromise<void>;
    onDelete: () => MaybePromise<void>;
    itemValue: string;
    renderPanel?: boolean;
  },
) => {
  const latex = useMemo(() => reactionAsLatex(process.reaction, species), [
    process.reaction,
    species,
  ]);

  const [ids, setIds] = useState(process.info.map((_) => nanoid()));

  return (
    <Accordion.Item value={itemValue}>
      <Center>
        <Accordion.Control>
          <Latex>{`$${latex}$`}</Latex>
        </Accordion.Control>
        <ActionIcon
          style={{ marginRight: 10 }}
          variant="subtle"
          color="red"
          onClick={onDelete}
        >
          <IconTrash />
        </ActionIcon>
      </Center>
      <Accordion.Panel>
        {renderPanel
          && (
            <Stack>
              <Fieldset legend="Reaction">
                <ReactionBuilder
                  reaction={process.reaction}
                  species={species}
                  onChange={(reaction) => onChange({ ...process, reaction })}
                />
              </Fieldset>
              <Fieldset legend="Info objects">
                <Stack>
                  <Accordion
                    defaultValue={process.info.length === 1 ? ids[0] : null}
                    variant="contained"
                    chevronPosition="left"
                  >
                    {process.info.map((info, index) => (
                      <ProcessInfoItem
                        key={ids[index]}
                        id={ids[index]}
                        info={info}
                        references={references}
                        onChange={(info) => {
                          return onChange({
                            ...process,
                            info: process.info.map((item, curIndex) =>
                              index === curIndex ? info : item
                            ),
                          });
                        }}
                        onDelete={() => {
                          setIds((ids) =>
                            ids.filter((_, curIndex) => curIndex !== index)
                          );
                          return onChange({
                            ...process,
                            info: process.info.filter((_, curIndex) =>
                              curIndex !== index
                            ),
                          });
                        }}
                      />
                    ))}
                  </Accordion>
                  <Center>
                    <Button
                      onClick={() => {
                        setIds((ids) => [...ids, nanoid()]);
                        return onChange({
                          ...process,
                          info: [...process.info, defaultInfoItem()],
                        });
                      }}
                      rightSection={<IconPlaylistAdd />}
                    >
                      Add info object
                    </Button>
                  </Center>
                </Stack>
              </Fieldset>
            </Stack>
          )}
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export const ProcessTab = (
  { processes, speciesMap, referenceMap, onChange, accordion }: {
    processes: EditedLTPDocument["processes"];
    speciesMap: Record<string, string>;
    referenceMap: Record<string, string>;
    onChange: (
      processes: EditedLTPDocument["processes"],
    ) => MaybePromise<void>;
    accordion: {
      value: string | null;
      onChange: (value: string | null) => void;
    };
  },
) => {
  const [ids, setIds] = useState(processes.map((_) => nanoid()));

  return (
    <Stack>
      <ScrollArea classNames={{ viewport: classes.processList }} type="auto">
        <Accordion
          {...accordion}
          classNames={accordionClasses}
          variant="contained"
          chevronPosition="left"
        >
          {processes.map((process, index) => {
            return (
              <ProcessItem
                key={ids[index]}
                itemValue={ids[index]}
                process={process}
                species={speciesMap}
                references={referenceMap}
                onChange={(process) => {
                  // processes[index] = process;
                  return onChange(
                    processes.map((item, curIndex) =>
                      curIndex === index ? process : item
                    ),
                  );
                }}
                onDelete={() => {
                  setIds((ids) =>
                    ids.filter((_, curIndex) => curIndex !== index)
                  );
                  return onChange(
                    processes.filter((_, curIndex) => curIndex !== index),
                  );
                }}
                renderPanel={ids[index] === accordion.value}
              />
            );
          })}
        </Accordion>
      </ScrollArea>
      <Center>
        <Button
          rightSection={<IconRowInsertBottom />}
          onClick={() => {
            setIds((ids) => [...ids, nanoid()]);
            return onChange([...processes, {
              reaction: { lhs: [], rhs: [], reversible: false, typeTags: [] },
              info: [],
            }]);
          }}
        >
          Add process
        </Button>
      </Center>
    </Stack>
  );
};
