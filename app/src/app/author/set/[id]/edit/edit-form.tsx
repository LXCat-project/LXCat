// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { PartialKeyedDocument } from "@lxcat/database/dist/schema/document";
import { StateTree } from "@lxcat/database/dist/shared/queries/state";
import { stateJSONSchema } from "@lxcat/schema/json-schema";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import {
  Accordion,
  Button,
  Checkbox,
  Modal,
  NativeSelect,
  Space,
  Stack,
  Tabs,
  Textarea,
  TextInput,
} from "@mantine/core";
import { createFormContext, zodResolver } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { JSONSchema7 } from "json-schema";
import { nanoid } from "nanoid";
import { useState } from "react";
import { FieldErrors, FieldPath, FieldValues, get } from "react-hook-form";
import { z } from "zod";
import { Latex } from "../../../../../shared/Latex";
import { generateSpeciesForm, SpeciesForm } from "./form-factory";
import { SpeciesNode, SpeciesPicker } from "./species-picker";

const EditFormValues = z.object({
  set: PartialKeyedDocument,
  commitMessage: z.string().min(1),
  meta: z.record(z.any()),
});
export type EditFormValues = z.input<typeof EditFormValues>;

type EditFormProps = {
  initialSet: PartialKeyedDocument;
  organizations: Array<string>;
};

export const getError = (
  errors: FieldErrors,
  name: FieldPath<FieldValues>,
): string => {
  const error = get(errors, name);

  return error ? error.message : "";
};

export const [FormProvider, useFormContext, useForm] = createFormContext<
  EditFormValues
>();

const emptySet = () => ({
  commitMessage: "",
  set: {
    $schema: "",
    url: "",
    termsOfUse: "",
    name: "",
    contributor: "",
    description: "",
    complete: false,
    references: {},
    states: {},
    processes: [],
  },
  meta: {},
});

export const EditForm = (
  { initialSet, organizations }: EditFormProps,
) => {
  const form = useForm(
    {
      validate: zodResolver(EditFormValues),
      initialValues: {
        commitMessage: "",
        set: initialSet,
        meta: {
          set: {
            states: Object.fromEntries(
              Object.entries(initialSet.states).map((
                [key, state],
              ) => {
                const metaState = {
                  electronic: {
                    anyOf: "0",
                    vibrational: { anyOf: "0", rotational: { anyOf: "0" } },
                  },
                };

                if (state.type !== "simple" && state.type !== "unspecified") {
                  if (Array.isArray(state.electronic)) {
                    metaState.electronic.anyOf = "1";
                  } else if (
                    "vibrational" in state.electronic
                    && state.electronic.vibrational
                  ) {
                    if (Array.isArray(state.electronic.vibrational)) {
                      metaState.electronic.vibrational.anyOf = "1";
                    } else if (
                      typeof state.electronic.vibrational === "string"
                    ) {
                      metaState.electronic.vibrational.anyOf = "2";
                    } else if ("rotational" in state.electronic.vibrational) {
                      if (
                        Array.isArray(state.electronic.vibrational.rotational)
                      ) {
                        metaState.electronic.vibrational.rotational.anyOf = "1";
                      } else if (
                        typeof state.electronic.vibrational.rotational
                          === "string"
                      ) {
                        metaState.electronic.vibrational.rotational.anyOf = "2";
                      }
                    }
                  }
                }

                return [key, metaState];
              }),
            ),
          },
        },
      },
      // {
      //   commitMessage: "",
      //   set: {
      //     name: "test",
      //     contributor: "TestContributor",
      //     description: "",
      //     complete: false,
      //     references: {},
      //     states: {
      //       test: {
      //         type: "AtomLS",
      //         particle: "He",
      //         charge: 0,
      //         electronic: {
      //           config: [],
      //           term: {
      //             L: 0,
      //             S: 0,
      //             P: 1,
      //             J: 0,
      //           },
      //         },
      //       },
      //     },
      //     processes: [],
      //   },
      //   meta: {
      //     set: {
      //       states: {
      //         test: {
      //           electronic: {
      //             anyOf: "0",
      //             vibrational: { anyOf: "0", rotational: { anyOf: "0" } },
      //           },
      //         },
      //       },
      //     },
      //   },
      // },
    },
  );
  const [activeTab, setActiveTab] = useState<string | null>("general");
  const [
    speciesPickerOpened,
    { open: openSpeciesPicker, close: closeSpeciesPicker },
  ] = useDisclosure(false);
  const [selectedSpecies, setSelectedSpecies] = useState<Array<SpeciesNode>>(
    [],
  );

  const { getInputProps } = form;

  return (
    <FormProvider form={form}>
      <form
        style={{ margin: 10 }}
        onSubmit={form.onSubmit((data) => {
          console.log(data);
        })}
      >
        <Tabs
          defaultValue="general"
          value={activeTab}
          onTabChange={setActiveTab}
        >
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="states">States</Tabs.Tab>
            <Tabs.Tab value="references">References</Tabs.Tab>
            <Tabs.Tab value="processes">Processes</Tabs.Tab>
            <Tabs.Tab value="json">JSON</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">
            <Stack spacing="xs">
              <TextInput
                label="Name"
                withAsterisk
                {...getInputProps("set.name")}
              />
              <Textarea
                label="Description"
                withAsterisk
                minRows={10}
                {...getInputProps("set.description")}
              />
              <Checkbox label="Complete" {...getInputProps("set.complete")} />
              <NativeSelect
                label="Contributor"
                data={organizations}
                {...getInputProps("set.contributor")}
              />
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="states">
            <Stack>
              <Accordion>
                {getInputProps(`set.states`).value
                  && Object.entries(form.values.set.states).map(
                    ([key, state]) => {
                      const parsed = AnySpeciesSerializable.safeParse(state);
                      const controlNode = parsed.success
                        ? parsed.data.serialize().latex
                        : "...";

                      return (
                        <Accordion.Item key={key} value={key}>
                          <Accordion.Control>
                            <Latex>{controlNode}</Latex>
                          </Accordion.Control>
                          <Accordion.Panel>
                            <SpeciesForm
                              typeMap={generateSpeciesForm(
                                stateJSONSchema as JSONSchema7,
                                `set.states.${key}`,
                              )}
                              basePath={`set.states.${key}`}
                            />
                          </Accordion.Panel>
                        </Accordion.Item>
                      );
                    },
                  )}
              </Accordion>
              <Button.Group>
                <Button
                  onClick={() => {
                    const id = nanoid();
                    form.setFieldValue(
                      "set.states",
                      {
                        ...form.values.set.states,
                        [id]: {
                          type: "simple",
                          particle: "",
                          charge: 0,
                        },
                      },
                    );
                    form.setFieldValue("meta.set.states", {
                      ...form.values.meta.set.states,
                      [id]: {
                        electronic: {
                          anyOf: "0",
                          vibrational: {
                            anyOf: "0",
                            rotational: { anyOf: "0" },
                          },
                        },
                      },
                    });
                  }}
                >
                  +
                </Button>
                <Button
                  variant="light"
                  onClick={openSpeciesPicker}
                >
                  Add from database
                </Button>
              </Button.Group>
              <Modal
                opened={speciesPickerOpened}
                onClose={closeSpeciesPicker}
                title="Choose existing species from the database"
              >
                <Stack>
                  <SpeciesPicker
                    selected={selectedSpecies}
                    setSelected={setSelectedSpecies}
                  />
                  <Button
                    onClick={() => {
                      for (const species of selectedSpecies) {
                        form.values.set.states[species._key] =
                          species.species.detailed;
                      }
                      closeSpeciesPicker();
                      setSelectedSpecies([]);
                    }}
                  >
                    Add
                  </Button>
                </Stack>
              </Modal>
            </Stack>
          </Tabs.Panel>
        </Tabs>
        <Space h="md" />
        <Stack spacing="sm">
          <TextInput
            label="Commit message"
            placeholder="Describe which changes have been made."
            {...getInputProps("commitMessage")}
          />
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </Stack>
      </form>
    </FormProvider>
  );
};
