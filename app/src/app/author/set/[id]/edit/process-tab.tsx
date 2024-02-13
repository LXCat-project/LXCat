// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MaybePromise } from "@/app/api/util";
import { reactionAsLatex } from "@/cs/reaction";
import { reference2bibliography } from "@/shared/cite";
import { type PartialKeyedDocument } from "@lxcat/database/schema";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import { Accordion, MultiSelect } from "@mantine/core";
import { useMemo } from "react";
import Latex from "react-latex-next";

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

const ProcessItem = (
  { process, species, references, reactionLatex, onChange }: {
    process: Process;
    species: PartialKeyedDocument["states"];
    references: PartialKeyedDocument["references"];
    reactionLatex: string;
    onChange: (process: Process) => MaybePromise<void>;
  },
) => {
  return (
    <Accordion.Item value={reactionLatex}>
      <Accordion.Control>
        <Latex>{`$${reactionLatex}$`}</Latex>
      </Accordion.Control>
      <Accordion.Panel>
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
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export const ProcessTab = (
  { processes, species, references, onChange }: {
    processes: PartialKeyedDocument["processes"];
    species: PartialKeyedDocument["states"];
    references: PartialKeyedDocument["references"];
    onChange: (
      processes: PartialKeyedDocument["processes"],
    ) => MaybePromise<void>;
  },
) => {
  return (
    <Accordion>
      {processes.map((process, index) => {
        const latex = reactionAsLatex(
          resolveReactionSpecies(process.reaction, species),
        );

        return (
          <ProcessItem
            key={latex}
            process={process}
            species={species}
            references={references}
            reactionLatex={latex}
            onChange={(process) => {
              processes[index] = process;
              onChange(processes);
            }}
          />
        );
      })}
    </Accordion>
  );
};
