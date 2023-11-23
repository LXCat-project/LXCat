// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reversible } from "@lxcat/database/item/picker";
import {
  Box,
  Group,
  MultiSelect,
  MultiSelectProps,
  Stack,
} from "@mantine/core";
import { CSSetFilter, CSSetFilterProps } from "./CSSetFilter";
import { LatexSelect, LatexSelectProps } from "./LatexSelect";
import classes from "./reaction-picker.module.css";
import { SWRStateList, SWRStateListProps } from "./SWRStateList";

interface SWRReactionPickerImplProps {
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

export const SWRReactionPickerImpl = ({
  consumes,
  produces,
  reversible: { choices, ...reversible },
  typeTags,
  sets,
}: SWRReactionPickerImplProps) => {
  return (
    <Group gap="xs">
      <Stack gap="xs">
        <Group gap="xs">
          <Box className={classes.list}>
            <SWRStateList {...consumes} />
          </Box>
          <LatexSelect
            {...reversible}
            data={Object.fromEntries(
              Object.entries(choiceMap).filter(([key, _]) =>
                choices.includes(key as Reversible)
              ),
            )}
            style={{ borderStyle: "none" }}
          />
          <Box className={classes.list}>
            <SWRStateList {...produces} />
          </Box>
        </Group>
        <MultiSelect
          placeholder="Reaction type tag(s)"
          {...typeTags}
        />
      </Stack>
      <Box className={classes.list}>
        <CSSetFilter {...sets} />
      </Box>
    </Group>
  );
};
