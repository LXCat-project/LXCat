// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { LTPDocument } from "@lxcat/schema/dist/document";
import { LTPDocumentJSONSchema } from "@lxcat/schema/dist/json-schema/document";
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
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import { FieldErrors, FieldPath, FieldValues, get } from "react-hook-form";
import { z } from "zod";
import { generateSpeciesForm, SpeciesForm } from "./form-factory";

const EditFormValues = z.object({
  set: LTPDocument,
  commitMessage: z.string().min(1),
  meta: z.record(z.any()),
});
export type EditFormValues = z.input<typeof EditFormValues>;

type EditFormProps = { organizations: Array<string> };

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

export const EditForm = ({ organizations }: EditFormProps) => {
  const form = useForm(
    {
      validate: zodResolver(EditFormValues),
      initialValues: emptySet(),
      // {
      //   commitMessage: "",
      //   set: {
      //     $schema: "",
      //     url: "",
      //     termsOfUse: "",
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
            {getInputProps(`set.states`).value
              && Object.entries(form.values.set.states).map(
                ([key, _]) => (
                  <div key={key}>
                    <SpeciesForm
                      typeMap={generateSpeciesForm(
                        LTPDocumentJSONSchema as JSONSchema7,
                        `set.states.${key}`,
                      )}
                      basePath={`set.states.${key}`}
                    />
                  </div>
                ),
              )}
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
