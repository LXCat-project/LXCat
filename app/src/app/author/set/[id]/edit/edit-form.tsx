// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { KeyedOrganization } from "@lxcat/database/auth";
import {
  EditedLTPDocument,
  Reference,
  type VersionedLTPDocument,
} from "@lxcat/schema";
import {
  Button,
  Checkbox,
  NativeSelect,
  Space,
  Stack,
  Tabs,
  Textarea,
  TextInput,
} from "@mantine/core";
import { createFormContext, zodResolver } from "@mantine/form";
import { useState } from "react";
import { FieldErrors, FieldPath, FieldValues, get } from "react-hook-form";
import { z } from "zod";
import { JsonTab } from "./json-tab";
import { ProcessTab } from "./process-tab";
import { ReferenceTable } from "./reference-table";
import { SpeciesTab } from "./species-tab";

const EditFormValues = z.object({
  set: EditedLTPDocument,
  commitMessage: z.string().min(1),
  meta: z.record(z.any()),
});
export type EditFormValues = z.input<typeof EditFormValues>;

type EditFormProps = {
  initialSet: VersionedLTPDocument;
  organizations: Array<KeyedOrganization>;
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
        set: EditedLTPDocument.parse({
          ...initialSet,
          contributor: initialSet.contributor.name,
        }),
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
          onChange={setActiveTab}
        >
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="species">Species</Tabs.Tab>
            <Tabs.Tab value="references">References</Tabs.Tab>
            <Tabs.Tab value="processes">Processes</Tabs.Tab>
            <Tabs.Tab value="json">JSON</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">
            <Stack gap="xs">
              <TextInput
                label="Name"
                withAsterisk
                {...getInputProps("set.name")}
              />
              <Textarea
                label="Description"
                withAsterisk
                rows={10}
                {...getInputProps("set.description")}
              />
              <Checkbox label="Complete" {...getInputProps("set.complete")} />
              <NativeSelect
                label="Contributor"
                data={organizations.map(({ name }) => name)}
                {...getInputProps("set.contributor")}
              />
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="species">
            <SpeciesTab
              species={form.values.set.states}
              meta={form.values.meta}
              onChange={(species, meta) => {
                form.setFieldValue("set.states", species);
                form.setFieldValue("set.meta", meta);
              }}
            />
          </Tabs.Panel>
          <Tabs.Panel value="references">
            <ReferenceTable
              references={Object.values(getInputProps("set.references").value)}
              onChange={(references: Array<Reference>) =>
                getInputProps("set.references").onChange(
                  Object.fromEntries(
                    references.map((reference) => [reference.id, reference]),
                  ),
                )}
            />
          </Tabs.Panel>
          <Tabs.Panel value="processes">
            <ProcessTab
              processes={form.values.set.processes}
              species={form.values.set.states}
              references={form.values.set.references}
              onChange={(processes) =>
                form.setFieldValue("set.processes", processes)}
            />
          </Tabs.Panel>
          <Tabs.Panel value="json">
            <JsonTab json={JSON.stringify(form.values.set, null, 2)} />
          </Tabs.Panel>
        </Tabs>
        <Space h="md" />
        <Stack gap="sm">
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
