// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MaybePromise } from "@/app/api/util";
import { ReferenceRef } from "@lxcat/schema/reference";
import {
  Button,
  Center,
  CheckIcon,
  Combobox,
  Fieldset,
  Group,
  ScrollArea,
  Stack,
  useCombobox,
} from "@mantine/core";
import { IconPlaylistAdd } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import Latex from "react-latex-next";
import { CommentSection } from "./comment-section";

type ReferenceButtonProps = {
  references: Record<string, string>;
  selected: Array<ReferenceRef<string>>;
  onChange: (selected: Array<ReferenceRef<string>>) => MaybePromise<void>;
};

const getRefKey = (ref: ReferenceRef<string>): string =>
  typeof ref === "string" ? ref : ref.id;

const ReferenceButton = (
  { selected, references, onChange }: ReferenceButtonProps,
) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const options = Object.entries(references).map(([key, ref]) => (
    <Combobox.Option value={key} key={key}>
      <Group>
        {selected.map(getRefKey).includes(key) && <CheckIcon size={12} />}
        <Latex>{ref}</Latex>
      </Group>
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      position="bottom-start"
      withArrow
      arrowPosition="center"
      withinPortal={false}
      positionDependencies={[selected]}
      onOptionSubmit={(refKey) => {
        onChange(
          selected.map(getRefKey).includes(refKey)
            ? selected.filter((item) => getRefKey(item) !== refKey)
            : [...selected, refKey],
        );
      }}
    >
      <Combobox.Target>
        <Center>
          <Button
            variant="light"
            rightSection={<IconPlaylistAdd />}
            onClick={() => combobox.toggleDropdown()}
          >
            Select reference
          </Button>
        </Center>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize mah={250} type="scroll">
            {options}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export const ReferenceSection = (
  { references, selected, onChange }: {
    references: Record<string, string>;
    selected: Array<ReferenceRef<string>>;
    onChange: (references: Array<ReferenceRef<string>>) => MaybePromise<void>;
  },
) => (
  <Stack>
    <DataTable
      withTableBorder
      borderRadius="sm"
      records={selected.map(entry =>
        typeof entry === "string"
          ? { id: entry, reference: references[entry], comments: [] }
          : { ...entry, reference: references[entry.id] }
      )}
      columns={[{
        accessor: "reference",
        title: "Name",
        render: (record) => <Latex>{record.reference}</Latex>,
      }]}
      rowExpansion={{
        content: ({ record, index }) => (
          <Fieldset style={{ margin: 5 }} legend="Comments for this reference">
            <CommentSection
              comments={record.comments}
              onChange={(comments) =>
                onChange(selected.map((ref, curIdx) => {
                  if (curIdx === index) {
                    if (comments === undefined) {
                      return record.id;
                    }
                    return { id: record.id, comments };
                  }

                  return ref;
                }))}
            />
          </Fieldset>
        ),
      }}
    />
    <ReferenceButton
      references={references}
      selected={selected}
      onChange={onChange}
    />
  </Stack>
);
