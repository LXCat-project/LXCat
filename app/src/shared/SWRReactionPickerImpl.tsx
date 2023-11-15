// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reversible } from "@lxcat/database/item/picker";
import {
  Box,
  Group,
  MantineTheme,
  MultiSelect,
  MultiSelectProps,
  Stack,
  Sx,
} from "@mantine/core";
import { CSSetFilter, CSSetFilterProps } from "./CSSetFilter";
import { LatexSelect, LatexSelectProps } from "./LatexSelect";
import { SWRStateList, SWRStateListProps } from "./SWRStateList";

interface SWRReactionPickerImplProps {
  consumes: SWRStateListProps;
  produces: SWRStateListProps;
  reversible: Omit<LatexSelectProps, "data"> & {
    choices: Array<Reversible>;
  };
  typeTags: Omit<MultiSelectProps, "sx">;
  sets: CSSetFilterProps;
}

const listStyle: Sx = (theme: MantineTheme) => ({
  padding: theme.spacing.xs,
  borderStyle: "solid",
  borderRadius: theme.radius.md,
  borderColor: theme.colors.gray[4],
  borderWidth: "thin",
});

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
    <Group spacing="xs">
      <Stack spacing="xs">
        <Group spacing="xs">
          <Box sx={listStyle}>
            <SWRStateList {...consumes} />
          </Box>
          <LatexSelect
            {...reversible}
            data={Object.fromEntries(
              Object.entries(choiceMap).filter(([key, _]) =>
                choices.includes(key as Reversible)
              ),
            )}
            sx={{ borderStyle: "none" }}
          />
          <Box sx={listStyle}>
            <SWRStateList {...produces} />
          </Box>
        </Group>
        <MultiSelect
          placeholder="Reaction type tag(s)"
          {...typeTags}
        />
      </Stack>
      <Box sx={listStyle}>
        <CSSetFilter {...sets} />
      </Box>
    </Group>
  );
};
