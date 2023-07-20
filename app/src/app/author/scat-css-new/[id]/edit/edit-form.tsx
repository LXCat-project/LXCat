"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LTPDocument } from "@lxcat/schema/dist/zod/document";
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
import { useState } from "react";
import {
  FieldErrors,
  FieldPath,
  FormProvider,
  get,
  useForm,
} from "react-hook-form";
import { z } from "zod";

const EditFormValues = z.object({
  set: LTPDocument,
  commitMessage: z.string().min(1),
});
type EditFormValues = z.input<typeof EditFormValues>;

type EditFormProps = { organizations: Array<string> };

const getError = (
  errors: FieldErrors<EditFormValues>,
  name: FieldPath<EditFormValues>,
): string => {
  const error = get(errors, name);

  return error ? error.message : "";
};

export const EditForm = ({ organizations }: EditFormProps) => {
  const form = useForm<EditFormValues>(
    {
      resolver: zodResolver(EditFormValues),
    },
  );
  const [activeTab, setActiveTab] = useState<string | null>("general");

  const { register, formState: { errors } } = form;

  return (
    <FormProvider {...form}>
      <form
        style={{ margin: 10 }}
        onSubmit={form.handleSubmit((data) => {
          console.log(data);
          console.log(errors);
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
                error={getError(errors, "set.name")}
                {...register("set.name")}
              />
              <Textarea
                label="Description"
                withAsterisk
                minRows={10}
                error={getError(errors, "set.description")}
                {...register("set.description")}
              />
              {
                // <Checkbox label="Complete" {...register("set.complete")} />
              }
              <NativeSelect
                label="Contributor"
                data={organizations}
                error={getError(errors, "set.contributor")}
                {...register("set.contributor")}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>
        <Space h="md" />
        <Stack spacing="sm">
          <TextInput
            label="Commit message"
            placeholder="Describe which changes have been made."
            error={getError(errors, "commitMessage")}
            {...register("commitMessage")}
          />
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </Stack>
      </form>
    </FormProvider>
  );
};
