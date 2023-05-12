// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CSSetTree } from "@lxcat/database/dist/cs/picker/types";
import { Box, Checkbox, Group, Space, Stack } from "@mantine/core";
import { IconChevronDown, IconChevronRight } from "@tabler/icons";

export type CSSetSelection = Set<string>;

export interface CSSetFilterProps {
  data: CSSetTree;
  selection: CSSetSelection;
  unfolded: Set<string>;
  onOrganizationChecked: (id: string, checked: boolean) => void;
  onOrganizationUnfolded: (id: string, unfolded: boolean) => void;
  onSetChecked: (setId: string, checked: boolean) => void;
}

export const CSSetFilter = ({
  data,
  selection,
  unfolded,
  onOrganizationChecked,
  onOrganizationUnfolded,
  onSetChecked,
}: CSSetFilterProps) => {
  return (
    <Stack spacing={3} align="flex-start">
      {Object.entries(data).map(([id, summary]) => {
        const numSelected = Object.keys(summary.sets).filter((setId) =>
          selection.has(setId)
        ).length;

        return (
          <Stack key={id} spacing={2}>
            <Group spacing={3}>
              {
                // FIXME: Duplicating onClick is not great, but adding Box or
                // div introduces weird displacement of the chevron.
                unfolded.has(id)
                  ? (
                    <IconChevronDown
                      size="1.4rem"
                      onClick={() => onOrganizationUnfolded(id, false)}
                    />
                  )
                  : (
                    <IconChevronRight
                      size="1.4rem"
                      onClick={() => onOrganizationUnfolded(id, true)}
                    />
                  )
              }
              <Checkbox
                size="sm"
                checked={numSelected > 0
                  && numSelected === Object.keys(summary.sets).length}
                indeterminate={numSelected > 0
                  && numSelected < Object.keys(summary.sets).length}
                disabled={Object.keys(summary.sets).length === 0}
                label={summary.name}
                onChange={(event) =>
                  onOrganizationChecked(id, event.currentTarget.checked)}
              />
            </Group>
            {unfolded.has(id)
              ? (
                <Stack spacing={3}>
                  {Object.entries(summary.sets).map(([setId, setName]) => (
                    <Group key={setId} spacing={0}>
                      <Space w={50} />
                      <Checkbox
                        size="sm"
                        checked={selection.has(setId)}
                        label={setName}
                        onChange={(event) =>
                          onSetChecked(setId, event.currentTarget.checked)}
                      />
                    </Group>
                  ))}
                </Stack>
              )
              : <></>}
          </Stack>
        );
      })}
    </Stack>
  );
};
