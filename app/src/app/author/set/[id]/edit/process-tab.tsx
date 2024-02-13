// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MaybePromise } from "@/app/api/util";
import { reactionAsLatex } from "@/cs/reaction";
import { reference2bibliography } from "@/shared/cite";
import { LatexSelect } from "@/shared/latex-select";
import { type PartialKeyedDocument } from "@lxcat/database/schema";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import {
  Accordion,
  Fieldset,
  Group,
  MultiSelect,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { useMemo } from "react";
import Latex from "react-latex-next";
import classes from "./process-tab.module.css";

type Process = PartialKeyedDocument["processes"][number];
type ProcessInfo = Process["info"][number];

const resolveReactionSpecies = (
  reaction: PartialKeyedDocument["processes"][number]["reaction"],
  species: PartialKeyedDocument["states"],
) => ({
  ...reaction,
  lhs: reaction.lhs.map(({ count, state }) => ({
    count,
    state: {
      detailed: species[state],
      serialized: AnySpeciesSerializable.parse(species[state]).serialize(),
    },
  })),
  rhs: reaction.rhs.map(({ count, state }) => ({
    count,
    state: {
      detailed: species[state],
      serialized: AnySpeciesSerializable.parse(species[state]).serialize(),
    },
  })),
});

const ProcessInfoItem = (
  { info, references, onChange }: {
    info: ProcessInfo;
    references: PartialKeyedDocument["references"];
    onChange: (info: ProcessInfo) => MaybePromise<void>;
  },
) => {
  const referenceMap = useMemo(() =>
    Object.fromEntries(
      Object.entries(references).map(([
        key,
        value,
      ]) => [key, reference2bibliography(value)]),
    ), [references]);

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
      data={Object.keys(references).map((key) => ({
        value: key,
        label: referenceMap[key],
      }))}
      // TODO: Use a component that allows for adding reference comments.
      value={info.references.map(ref => typeof ref === "object" ? ref.id : ref)}
      onChange={(references) => onChange({ ...info, references })}
    />
  );
};

const ReactionBuilder = (
  { reaction, species, onChange }: {
    reaction: Process["reaction"];
    species: PartialKeyedDocument["states"];
    onChange: (reaction: Process["reaction"]) => MaybePromise<void>;
  },
) => (
  <Group>
    <LatexSelect
      value={reaction.reversible ? "true" : "false"}
      data={{ false: "\\rightarrow", true: "\\leftrightarrow" }}
      onChange={(value) =>
        onChange({ ...reaction, reversible: value === "true" })}
    />
  </Group>
);

const ProcessItem = (
  { process, species, references, onChange, itemValue }: {
    process: Process;
    species: PartialKeyedDocument["states"];
    references: PartialKeyedDocument["references"];
    onChange: (process: Process) => MaybePromise<void>;
    itemValue: string;
  },
) => {
  const latex = useMemo(() =>
    reactionAsLatex(
      resolveReactionSpecies(process.reaction, species),
    ), [process.reaction, species]);

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
) => (
  <ScrollArea classNames={{ viewport: classes.processList }} type="auto">
    <Accordion {...accordion}>
      {processes.map((process, index) => {
        return (
          <ProcessItem
            key={index}
            itemValue={`process-${index}`}
            process={process}
            species={species}
            references={references}
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
