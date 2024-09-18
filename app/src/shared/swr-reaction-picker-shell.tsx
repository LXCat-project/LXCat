// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reversible } from "@lxcat/database/item/picker";
import {
  Box,
  Fieldset,
  Group,
  MultiSelect,
  MultiSelectProps,
  Stack,
} from "@mantine/core";
import { CSSetFilter, CSSetFilterProps } from "./cs-set-filter";
import { LatexSelect, LatexSelectProps } from "./latex-select";
import { SWRStateList, SWRStateListProps } from "./swr-state-list";

interface SWRReactionPickerShellProps {
  consumes: SWRStateListProps;
  produces: SWRStateListProps;
  reversible: Omit<LatexSelectProps, "data"> & {
    choices: Array<Reversible>;
  };
  typeTags: MultiSelectProps;
  sets: CSSetFilterProps;
}

const choiceMap: Record<Reversible, string> = {
  [Reversible.Both]: "\\rightarrow \\\\ \\leftrightarrow",
  [Reversible.False]: "\\rightarrow",
  [Reversible.True]: "\\leftrightarrow",
};

export const SWRReactionPickerShell = ({
  consumes,
  produces,
  reversible: { choices, ...reversible },
  typeTags,
  sets,
}: SWRReactionPickerShellProps) => {
  return (
    <Group gap="xs">
      <Stack gap="xs">
        <Group gap="xs">
          <Fieldset legend="Left-hand side">
            <SWRStateList {...consumes} />
          </Fieldset>
          <LatexSelect
            {...reversible}
            data={Object.fromEntries(
              Object.entries(choiceMap).filter(([key, _]) =>
                choices.includes(key as Reversible)
              ),
            )}
          />
          <Fieldset legend="Right-hand side">
            <SWRStateList {...produces} />
          </Fieldset>
        </Group>
        <MultiSelect
          placeholder="Reaction type tag(s)"
          {...typeTags}
        />
      </Stack>
      <Fieldset legend="Set selection">
        <CSSetFilter {...sets} />
      </Fieldset>
    </Group>
  );
};
