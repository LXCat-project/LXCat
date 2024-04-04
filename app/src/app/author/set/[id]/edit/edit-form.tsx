// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { KeyedOrganization } from "@lxcat/database/auth";
import { EditedLTPDocument, Reference } from "@lxcat/schema";
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
import { z } from "zod";
import { JsonTab } from "./json-tab";
import { ProcessTab } from "./process-tab";
import { ReferenceTable } from "./reference-table";
import { SpeciesTab } from "./species-tab";

const EditFormValues = z.object({
  set: EditedLTPDocument,
  commitMessage: z.string().min(1),
});
export type EditFormValues = z.input<typeof EditFormValues>;

type EditFormProps = {
  initialSet: EditedLTPDocument;
  organizations: Array<KeyedOrganization>;
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
      },
    },
  );
  const [activeTab, setActiveTab] = useState<string | null>("general");
  const { getInputProps } = form;

  const [processAccordionState, processAccordionOnChange] = useState<
    string | null
  >(null);

  return (
    <FormProvider form={form}>
      <form
        style={{ margin: 10 }}
        onSubmit={form.onSubmit(async (formData) => {
          const url = `/api/author/scat-css/${formData.set._key!}`;
          const body = JSON.stringify({
            doc: formData.set,
            message: formData.commitMessage,
          });
          const headers = new Headers({
            Accept: "application/json",
            "Content-Type": "application/json",
          });
          const init = { method: "POST", body, headers };
          const res = await fetch(url, init);
          const data = await res.json();
          // TODO: Handle user feedback.
          console.log(data);
        })}
      >
        <Tabs
          defaultValue="general"
          value={activeTab}
          onChange={setActiveTab}
          keepMounted={false}
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
              onChange={(species) => {
                // NOTE: This is quite inefficient. However, it is far from the
                //       bottleneck (rendering and state updates are the
                //       problem).
                const processes = Object.keys(species).length
                    < Object.keys(form.values.set.states).length
                  ? form.values.set.processes.map((process) => ({
                    ...process,
                    reaction: {
                      ...process.reaction,
                      lhs: process.reaction.lhs.filter((entry) =>
                        entry.state in species
                      ),
                      rhs: process.reaction.rhs.filter((entry) =>
                        entry.state in species
                      ),
                    },
                  }))
                  : form.values.set.processes;

                form.setValues(
                  {
                    ...form.values,
                    set: { ...form.values.set, states: species, processes },
                  },
                );
              }}
            />
          </Tabs.Panel>
          <Tabs.Panel value="references">
            <ReferenceTable
              references={Object.values(getInputProps("set.references").value)}
              onChange={(references: Array<Reference>) => {
                const referenceMap = Object.fromEntries(
                  references.map((reference) => [reference.id, reference]),
                );

                // NOTE: This is quite inefficient. However, it is far from the
                //       bottleneck (rendering and state updates are the
                //       problem).
                const processes = references.length
                    < Object.keys(form.values.set.references).length
                  ? form.values.set.processes.map((process) => ({
                    ...process,
                    info: process.info.map((info) => ({
                      ...info,
                      references: info.references.filter((ref) =>
                        (typeof ref === "object" ? ref.id : ref) in referenceMap
                      ),
                    })),
                  }))
                  : form.values.set.processes;

                getInputProps("set").onChange({
                  ...form.values.set,
                  processes,
                  references: referenceMap,
                });
              }}
            />
          </Tabs.Panel>
          <Tabs.Panel value="processes">
            <ProcessTab
              processes={form.values.set.processes}
              species={form.values.set.states}
              references={form.values.set.references}
              onChange={(processes) =>
                form.setFieldValue("set.processes", processes)}
              accordion={{
                value: processAccordionState,
                onChange: processAccordionOnChange,
              }}
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
