import { MaybePromise } from "@/app/api/util";
import { LatexSelect } from "@/shared/latex-select";
import { PartialKeyedDocument } from "@lxcat/database/schema";
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

type Process = PartialKeyedDocument["processes"][number];

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
        <Group key={entry.state} justify="space-between">
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
