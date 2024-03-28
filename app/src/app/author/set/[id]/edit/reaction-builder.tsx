// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MaybePromise } from "@/app/api/util";
import { LatexSelect } from "@/shared/latex-select";
import { EditedLTPDocument } from "@lxcat/schema";
import { ReactionTypeTag } from "@lxcat/schema/process";
import {
  ActionIcon,
  Button,
  Center,
  Fieldset,
  Group,
  MultiSelect,
  NumberInput,
  Stack,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { useState } from "react";

type Process = EditedLTPDocument["processes"][number];

const SpeciesBuilder = (
  { entries, species, onChange }: {
    entries: Process["reaction"]["lhs"];
    species: Record<string, string>;
    onChange: (entries: Process["reaction"]["lhs"]) => MaybePromise<void>;
  },
) => {
  const [ids, setIds] = useState(entries.map(_ => nanoid()));

  return (
    <Stack>
      {entries.map((entry, index) => {
        return (
          <Group key={ids[index]} justify="space-between">
            <NumberInput
              allowDecimal={false}
              allowNegative={false}
              min={1}
              style={{ width: "70px" }}
              value={entry.count}
              onChange={(count) =>
                onChange(
                  entries.with(index, { ...entry, count: count as number }),
                )}
            />
            <LatexSelect
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
              onClick={() => {
                setIds((ids) =>
                  ids.filter((_, curIndex) => curIndex !== index)
                );
                return onChange(
                  entries.filter((_, curIndex) => curIndex !== index),
                );
              }}
            >
              <IconTrash />
            </ActionIcon>
          </Group>
        );
      })}
      <Center>
        <Button
          style={{ width: 180 }}
          onClick={() => {
            if (entries.every((entry) => entry.state in species)) {
              setIds((ids) => [...ids, nanoid()]);
              return onChange([...entries, { count: 1, state: "" }]);
            }
          }}
        >
          +
        </Button>
      </Center>
    </Stack>
  );
};

export const ReactionBuilder = (
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
