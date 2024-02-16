// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MaybePromise } from "@/app/api/util";
import { reference2bibliography } from "@/shared/cite";
import { type PartialKeyedDocument } from "@lxcat/database/schema";
import { CrossSectionInfo, ReactionEntry } from "@lxcat/schema/process";
import { ReferenceRef } from "@lxcat/schema/reference";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import {
  Accordion,
  ActionIcon,
  Button,
  Center,
  Fieldset,
  Group,
  MultiSelect,
  ScrollArea,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";
import Latex from "react-latex-next";
import { LookupTable } from "./lookup-table";
import classes from "./process-tab.module.css";
import { ReactionBuilder } from "./reaction-builder";

type Process = PartialKeyedDocument["processes"][number];
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

const dataTypeLabels = { "LUT": "Lookup table" };
const dataTypeSelectData = Object
  .entries(dataTypeLabels)
  .map(([value, label]) => ({ value, label }));

const ProcessInfoData = (
  { data, onChange }: {
    data: ProcessInfo["data"];
    onChange: (data: ProcessInfo["data"]) => MaybePromise<void>;
  },
) => (
  <Stack gap="sm">
    <Select
      label="Type"
      allowDeselect={false}
      value={data.type}
      data={dataTypeSelectData}
    />
    <LookupTable
      data={data}
      onChange={onChange}
    />
  </Stack>
);

const CommentSection = (
  { comments, onChange }: {
    comments: Array<string> | undefined;
    onChange: (comments: Array<string> | undefined) => MaybePromise<void>;
  },
) => (
  <Stack justify="stretch">
    {comments?.map((comment, index) => {
      return (
        <Group key={index} justify="center">
          <TextInput
            style={{ flexGrow: 1 }}
            value={comment}
            onChange={(event) => {
              const newComments = [...comments];
              newComments[index] = event.currentTarget.value;
              return onChange(newComments);
            }}
          />
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() =>
              onChange(
                comments
                  ? comments.filter((_, curIndex) => curIndex !== index)
                  : undefined,
              )}
          >
            <IconTrash />
          </ActionIcon>
        </Group>
      );
    })}
    <Center>
      <Button
        variant="light"
        style={{ width: 200 }}
        onClick={() => onChange(comments ? [...comments, ""] : [""])}
      >
        +
      </Button>
    </Center>
  </Stack>
);

const typeLabelMap = { "CrossSection": "Cross section" };
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
          <MultiSelect
            label="References"
            data={Object.entries(references).map(([value, label]) => ({
              value,
              label,
            }))}
            // TODO: Use a component that allows for adding reference comments.
            value={info.references.map(ref =>
              typeof ref === "object" ? ref.id : ref
            )}
            onChange={(references) => onChange({ ...info, references })}
          />
          <Fieldset legend="Data">
            <ProcessInfoData
              data={info.data}
              onChange={(data) => onChange({ ...info, data })}
            />
          </Fieldset>
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
    units: ["eV", "m2"],
    values: [[0, 0]],
  },
});

const ProcessItem = (
  { process, species, references, onChange, itemValue, renderPanel = true }: {
    process: Process;
    species: Record<string, string>;
    references: Record<string, string>;
    onChange: (process: Process) => MaybePromise<void>;
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
      <Accordion.Control>
        <Latex>{`$${latex}$`}</Latex>
      </Accordion.Control>
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
                          process.info[index] = info;
                          onChange(process);
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
                      style={{ width: 300 }}
                      onClick={() => {
                        setIds((ids) => [...ids, nanoid()]);
                        return onChange({
                          ...process,
                          info: [...process.info, defaultInfoItem()],
                        });
                      }}
                    >
                      +
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
  { processes, species, references, onChange, accordion }: {
    processes: PartialKeyedDocument["processes"];
    species: PartialKeyedDocument["states"];
    references: PartialKeyedDocument["references"];
    onChange: (
      processes: PartialKeyedDocument["processes"],
    ) => MaybePromise<void>;
    accordion: {
      value: string | null;
      onChange: (value: string | null) => void;
    };
  },
) => {
  // TODO: It might be better to supply these maps as a property, as this
  //       component is often un- and remounted.
  const speciesMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(species).map((
          [key, species],
        ) => [key, AnySpeciesSerializable.parse(species).serialize().latex]),
      ),
    [species],
  );

  const referenceMap = useMemo(() =>
    Object.fromEntries(
      Object.entries(references).map(([
        key,
        value,
      ]) => [key, reference2bibliography(value)]),
    ), [references]);

  return (
    <ScrollArea classNames={{ viewport: classes.processList }} type="auto">
      <Accordion {...accordion} variant="contained">
        {processes.map((process, index) => {
          return (
            <ProcessItem
              key={index}
              itemValue={`process-${index}`}
              process={process}
              species={speciesMap}
              references={referenceMap}
              onChange={(process) => {
                processes[index] = process;
                onChange(processes);
              }}
              renderPanel={`process-${index}` === accordion.value}
            />
          );
        })}
      </Accordion>
    </ScrollArea>
  );
};
