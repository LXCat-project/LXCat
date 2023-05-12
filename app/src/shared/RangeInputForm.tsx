// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Group, Select, Stack } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IntegerInput } from "./IntegerInput";
import { ScientificInput } from "./ScientificInput";

interface RangeInputFormProperties<FormSchema> {
  label: React.ReactNode;
  form: UseFormReturnType<FormSchema>;
  basePath: string;
}

export function RangeInputForm<FormSchema>(
  { label, form, basePath }: RangeInputFormProperties<FormSchema>,
) {
  return (
    <Stack spacing="xs">
      <Select
        label={label}
        data={[
          { label: "Constant", value: "constant" },
          { label: "Linear", value: "linear" },
          { label: "Quadratic", value: "quadratic" },
          { label: "Exponential", value: "exponential" },
        ]}
        {...form.getInputProps(`${basePath}.type`)}
      />
      {form.getInputProps(`${basePath}.type`).value === "constant"
        ? (
          <ScientificInput
            placeholder="Value"
            {...form.getInputProps(`${basePath}.value`)}
          />
        )
        : (
          <Group align="start" grow spacing="xs">
            <ScientificInput
              placeholder="From"
              {...form.getInputProps(`${basePath}.from`)}
            />
            <ScientificInput
              placeholder="To"
              {...form.getInputProps(`${basePath}.to`)}
            />
            <IntegerInput
              placeholder="Steps"
              {...form.getInputProps(`${basePath}.steps`)}
            />
          </Group>
        )}
    </Stack>
  );
}
