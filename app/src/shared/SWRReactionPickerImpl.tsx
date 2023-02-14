// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  Box,
  MantineTheme,
  MultiSelect,
  MultiSelectProps,
  Sx,
} from "@mantine/core";
import { LatexSelect, LatexSelectProps } from "./LatexSelect";
import { Reversible } from "@lxcat/database/dist/cs/picker/types";
import { CSSetFilter, CSSetFilterProps } from "./CSSetFilter";
import { SWRStateList, SWRStateListProps } from "./SWRStateList";

interface SWRReactionPickerImplProps {
  consumes: SWRStateListProps;
  produces: SWRStateListProps;
  reversible: Omit<LatexSelectProps, "choices"> & {
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
    <table>
      <tbody>
        <tr>
          <td>
            <Box sx={listStyle}>
              <SWRStateList {...consumes} />
            </Box>
          </td>
          <td>
            <LatexSelect
              choices={Object.fromEntries(
                Object.entries(choiceMap).filter(([key, _]) =>
                  choices.includes(key as Reversible)
                )
              )}
              {...reversible}
            />
          </td>
          <td>
            <Box sx={listStyle}>
              <SWRStateList {...produces} />
            </Box>
          </td>
          <td rowSpan={2} style={{ verticalAlign: "top" }}>
            <Box sx={listStyle}>
              <CSSetFilter {...sets} />
            </Box>
          </td>
        </tr>
        <tr>
          <td colSpan={3}>
            <MultiSelect
              sx={{}}
              placeholder="Reaction type tag(s)"
              {...typeTags}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
