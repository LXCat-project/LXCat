"use client";

import { type PartialKeyedDocument } from "@lxcat/database/schema";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import { Accordion, MultiSelect } from "@mantine/core";
import { useMemo } from "react";
import Latex from "react-latex-next";
import { reactionAsLatex } from "../../../../../cs/reaction";
import { reference2bibliography } from "../../../../../shared/cite";
import { MaybePromise } from "../../../../api/util";

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

const ProcessItem = (
  { process, species, references }: {
    process: PartialKeyedDocument["processes"][number];
    species: PartialKeyedDocument["states"];
    references: PartialKeyedDocument["references"];
  },
) => {
  const latex = useMemo(
    () => reactionAsLatex(resolveReactionSpecies(process.reaction, species)),
    [process, species],
  );

  return (
    <Accordion.Item key={latex} value={latex}>
      <Accordion.Control>
        <Latex>{`$${latex}$`}</Latex>
      </Accordion.Control>
      <Accordion.Panel>
        {
          // TODO: References are linked to an info object, not to a reaction.
        }
        <MultiSelect
          data={Object.entries(references).map(([key, reference]) => ({
            value: key,
            label: reference2bibliography(reference),
          }))}
        />
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
      {processes.map((process) => (
        <ProcessItem
          process={process}
          species={species}
          references={references}
        />
      ))}
    </Accordion>
  );
};
