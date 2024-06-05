// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MaybePromise } from "@/app/api/util";
import { ScientificInput } from "@/shared/scientific-input";
import { LUT } from "@lxcat/schema/data-types";
import {
  ActionIcon,
  Button,
  Center,
  FileButton,
  Group,
  ScrollArea,
  Stack,
  Table,
  TextInput,
} from "@mantine/core";
import {
  IconCsv,
  IconFileTypeCsv,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconTrash,
} from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { useState } from "react";

import classes from "./lookup-table.module.css";

export const LookupTable = (
  { data, onChange }: {
    data: LUT;
    onChange: (data: LUT) => MaybePromise<void>;
  },
) => {
  // NOTE: This is okay as long as this is the only component that adds and
  //       removes entries in `data.values`.
  const [ids, setIds] = useState(data.values.map((_) => nanoid()));

  async function loadCSV(file: File | null) {
    if (file === null) return;

    return loadCSVString(await file.text());
  }

  async function loadCSVString(csvText: string) {
    const values = csvText.split(/\r?\n/).filter((line) => line.length > 0).map(
      (line): [number, number] => {
        const cols = line.split(/[,\t]/).map(Number);
        return [cols[0], cols[1]];
      },
    );

    setIds(() => values.map((_) => nanoid()));
    return onChange({ ...data, values });
  }

  async function loadCSVFromClipboard() {
    // NOTE: The `navigator.clipboard` API and is not yet supported in all
    //       common browsers (e.g. Firefox at the time of writing).
    const text = await navigator.clipboard.readText();
    console.log(text);
    return loadCSVString(text);
  }

  return (
    <Stack>
      <ScrollArea classNames={classes} type="always">
        <Table stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Group>
                  <TextInput
                    variant="default"
                    value={data.labels[0]}
                    onChange={(event) =>
                      onChange({
                        ...data,
                        labels: [event.currentTarget.value, data.labels[1]],
                      })}
                  />
                  <TextInput
                    variant="default"
                    value={data.units[0]}
                    onChange={(event) =>
                      onChange({
                        ...data,
                        units: [event.currentTarget.value, data.units[1]],
                      })}
                  />
                </Group>
              </Table.Th>
              <Table.Th>
                <Group>
                  <TextInput
                    variant="default"
                    value={data.labels[1]}
                    onChange={(event) =>
                      onChange({
                        ...data,
                        labels: [data.labels[0], event.currentTarget.value],
                      })}
                  />
                  <TextInput
                    variant="default"
                    value={data.units[1]}
                    onChange={(event) =>
                      onChange({
                        ...data,
                        labels: [data.units[0], event.currentTarget.value],
                      })}
                  />
                </Group>
              </Table.Th>
              <Table.Th>Controls</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.values.map(([x, y], index) => (
              <Table.Tr key={ids[index]}>
                <Table.Td>
                  <ScientificInput
                    value={x}
                    variant="unstyled"
                    onChange={(value) => {
                      const values = [...data.values];
                      values[index] = [value as number, y];
                      return onChange({ ...data, values });
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <ScientificInput
                    variant="unstyled"
                    value={y}
                    onChange={(value) => {
                      const values = [...data.values];
                      values[index] = [x, value as number];
                      return onChange({ ...data, values });
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon.Group>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => {
                        setIds((ids) =>
                          ids.flatMap((id, curIndex) =>
                            curIndex === index ? [nanoid(), id] : [id]
                          )
                        );
                        return onChange({
                          ...data,
                          values: data.values.flatMap((value, curIndex) =>
                            curIndex === index ? [[0, 0], value] : [value]
                          ),
                        });
                      }}
                    >
                      <IconRowInsertTop />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="green"
                      onClick={() => {
                        setIds((ids) =>
                          ids.flatMap((id, curIndex) =>
                            curIndex === index ? [id, nanoid()] : [id]
                          )
                        );
                        return onChange({
                          ...data,
                          values: data.values.flatMap((value, curIndex) =>
                            curIndex === index ? [value, [0, 0]] : [value]
                          ),
                        });
                      }}
                    >
                      <IconRowInsertBottom />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      disabled={data.values.length === 1}
                      onClick={() => {
                        setIds((ids) =>
                          ids.filter((_, curIndex) => curIndex !== index)
                        );
                        return onChange({
                          ...data,
                          values: data.values.filter((_, curIndex) =>
                            curIndex !== index
                          ),
                        });
                      }}
                    >
                      <IconTrash />
                    </ActionIcon>
                  </ActionIcon.Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Center>
        <Button.Group>
          <FileButton onChange={loadCSV} accept="text/csv">
            {(props) => (
              <Button
                {...props}
                variant="light"
                rightSection={<IconFileTypeCsv />}
              >
                Copy from CSV
              </Button>
            )}
          </FileButton>
          <Button onClick={loadCSVFromClipboard} rightSection={<IconCsv />}>
            Copy from clipboard
          </Button>
        </Button.Group>
      </Center>
    </Stack>
  );
};
