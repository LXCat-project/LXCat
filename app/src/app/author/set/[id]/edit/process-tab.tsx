// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MaybePromise } from "@/app/api/util";
import { reference2bibliography } from "@/shared/cite";
import { LatexSelect } from "@/shared/latex-select";
import { type PartialKeyedDocument } from "@lxcat/database/schema";
import { ReactionEntry, ReactionTypeTag } from "@lxcat/schema/process";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import {
  Accordion,
  ActionIcon,
  Button,
  Center,
  Fieldset,
  Group,
  MultiSelect,
  NumberInput,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import Latex from "react-latex-next";
import classes from "./process-tab.module.css";

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

export function reactionAsLatex(
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

const ProcessInfoItem = (
  { info, references, onChange }: {
    info: ProcessInfo;
    references: Record<string, string>;
    onChange: (info: ProcessInfo) => MaybePromise<void>;
  },
) => {
  // Filters out removed references.
  const filteredRefs = info.references.filter((ref) =>
    typeof ref === "object" ? ref.id : ref in references
  );

  if (filteredRefs.length < info.references.length) {
    onChange({ ...info, references: filteredRefs });
  }

  return (
    <MultiSelect
      label="References"
      data={Object.entries(references).map(([value, label]) => ({
        value,
        label,
      }))}
      // TODO: Use a component that allows for adding reference comments.
      value={info.references.map(ref => typeof ref === "object" ? ref.id : ref)}
      onChange={(references) => onChange({ ...info, references })}
    />
  );
};

const SpeciesBuilder = (
  { entries, species, onChange }: {
    entries: Process["reaction"]["lhs"];
    species: Record<string, string>;
    onChange: (entries: Process["reaction"]["lhs"]) => MaybePromise<void>;
  },
) => (
  <Stack>
    {entries.map((entry, index) => {
      return (
        <Group justify="space-between">
          <NumberInput
            allowDecimal={false}
            allowNegative={false}
            min={1}
            style={{ width: "70px" }}
            value={entry.count}
            onChange={(count) => {
              const newEntries = [...entries];
              newEntries[index].count = count as number;
              return onChange(newEntries);
            }}
          />
          <LatexSelect
            key={entry.state}
            value={entry.state}
            data={species}
            onChange={(speciesKey) => {
              const newEntries = [...entries];
              newEntries[index].state = speciesKey!;
              return onChange(newEntries);
            }}
            grow
          />
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() =>
              onChange(entries.filter((_, curIndex) => curIndex !== index))}
          >
            <IconTrash />
          </ActionIcon>
        </Group>
      );
    })}
    <Button
      onClick={() => {
        if (entries.every((entry) => entry.state in species)) {
          onChange([...entries, { count: 1, state: "" }]);
        }
      }}
    >
      +
    </Button>
  </Stack>
);

const ReactionBuilder = (
  { reaction, species, onChange }: {
    reaction: Process["reaction"];
    species: Record<string, string>;
    onChange: (reaction: Process["reaction"]) => MaybePromise<void>;
  },
) => (
  <Stack align="stretch">
    <Group justify="space-evenly">
      <Fieldset legend="Reactants">
        <SpeciesBuilder
          entries={reaction.lhs}
          species={species}
          onChange={(lhs) => onChange({ ...reaction, lhs })}
        />
      </Fieldset>
      <LatexSelect
        value={reaction.reversible ? "true" : "false"}
        data={{ false: "\\rightarrow", true: "\\leftrightarrow" }}
        onChange={(value) =>
          onChange({ ...reaction, reversible: value === "true" })}
      />
      <Fieldset legend="Products">
        <SpeciesBuilder
          entries={reaction.rhs}
          species={species}
          onChange={(rhs) => onChange({ ...reaction, rhs })}
        />
      </Fieldset>
    </Group>
    <Center>
      <MultiSelect
        label="Type tags"
        value={reaction.typeTags}
        data={ReactionTypeTag.options}
        onChange={(tags) =>
          onChange({ ...reaction, typeTags: tags as Array<ReactionTypeTag> })}
        style={{ minWidth: "300px", maxWidth: "500px" }}
      />
    </Center>
  </Stack>
);

const ProcessItem = (
  { process, species, references, onChange, itemValue }: {
    process: Process;
    species: Record<string, string>;
    references: Record<string, string>;
    onChange: (process: Process) => MaybePromise<void>;
    itemValue: string;
  },
) => {
  const latex = useMemo(() => reactionAsLatex(process.reaction, species), [
    process.reaction,
    species,
  ]);

  return (
    <Accordion.Item value={itemValue}>
      <Accordion.Control>
        <Latex>{`$${latex}$`}</Latex>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack>
          <Fieldset legend="Reaction">
            <ReactionBuilder
              reaction={process.reaction}
              species={species}
              onChange={(reaction) => onChange({ ...process, reaction })}
            />
          </Fieldset>
          <Fieldset legend="Info objects">
            {process.info.map((info, index) => (
              <ProcessInfoItem
                key={index}
                info={info}
                references={references}
                onChange={(info) => {
                  process.info[index] = info;
                  onChange(process);
                }}
              />
            ))}
          </Fieldset>
        </Stack>
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
      <Accordion {...accordion}>
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
            />
          );
        })}
      </Accordion>
    </ScrollArea>
  );
};
