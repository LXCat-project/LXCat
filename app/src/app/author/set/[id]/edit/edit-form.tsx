// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { formatReference } from "@/citation/cite";
import { zodResolver } from "@/shared/forms/zod-resolver";
import { KeyedOrganization } from "@lxcat/database/auth";
import { EditedLTPDocument, Reference } from "@lxcat/schema";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import {
  Button,
  Checkbox,
  Group,
  NativeSelect,
  Select,
  Space,
  Stack,
  Tabs,
  Textarea,
  TextInput,
} from "@mantine/core";
import { createFormContext } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { createSetAction, updateSetAction } from "../../actions";
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

  const speciesMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(form.values.set.states).map((
          [key, species],
        ) => [key, AnySpeciesSerializable.parse(species).serialize().latex]),
      ),
    [form.values.set.states],
  );

  const [referenceMap, setReferenceMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    formatReference(form.values.set.references).then((res) => {
      if (active) {
        setReferenceMap(res);
      }
    });
    return () => {
      active = false;
    };
  }, [form.values.set.references]);

  return (
    <FormProvider form={form}>
      <form
        style={{ margin: 10 }}
        onSubmit={form.onSubmit(async (formData) => {
          notifications.clean();

          let result;
          try {
            result = formData.set._key
              ? await updateSetAction(
                formData.set._key,
                formData.set,
                formData.commitMessage,
              )
              : await createSetAction(formData.set, formData.commitMessage);
          } catch (error) {
            // The text of an error thrown by an action is not sent to the
            // browser in production, so we can only describe the likely causes.
            console.error(error);
            notifications.show({
              color: "red",
              title: "Could not save the set",
              message:
                "The set was probably not saved. Reload the page and try again, and check that you are still signed in as an author. Your edits are still in the form, copy them first if you are unsure.",
              autoClose: false,
            });
            return;
          }

          if (!result.ok) {
            notifications.show({
              color: "red",
              title: "Could not save the set",
              message: (
                <>
                  {result.error.map((message, index) => (
                    <div key={index}>{message}</div>
                  ))}
                </>
              ),
              autoClose: false,
            });
            return;
          }

          const { id } = result.value;
          form.setFieldValue("set._key", id);
          window.history.pushState(null, "", `/author/set/${id}/edit`);
          notifications.show({
            color: "teal",
            title: "Set saved",
            message: `Saved set with id ${id}.`,
          });
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
              <Checkbox
                label="Complete"
                {...getInputProps("set.complete", { type: "checkbox" })}
              />
              <Select
                label="Published in"
                allowDeselect={false}
                data={Object.entries(referenceMap).map((
                  [value, label],
                ) => ({ value, label }))}
                {...getInputProps("set.publishedIn")}
              />
              <NativeSelect
                label="Contributor"
                data={organizations.map(({ name }) => name)}
                disabled={!!form.values.set._key}
                {...getInputProps("set.contributor")}
              />
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="species">
            <SpeciesTab
              // NOTE: For some reason we need this cast (even though the types
              //       should be exactly the same).
              species={form.values.set.states as EditedLTPDocument["states"]}
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
              // Use database _key as id property for existing references.
              references={Object.entries(form.values.set.references).map((
                [id, ref],
              ) => ({ ...ref, id }))}
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
              speciesMap={speciesMap}
              referenceMap={referenceMap}
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
          <Group>
            <Button type="submit" loading={form.submitting}>Submit</Button>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
};
