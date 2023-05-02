// @ts-nocheck

import { Group, Select, Stack } from "@mantine/core";
import { AnyPositiveRange } from "../solvers/bolsig/io";
import { IntegerInput } from "./IntegerInput";
import { ScientificInput } from "./ScientificInput";

interface RangeInputProps {
  label: React.ReactNode;
  value: AnyPositiveRange;
  onChange: (value: AnyPositiveRange) => void | Promise<void>;
}

export const RangeInput = (
  { label, value: data, onChange }: RangeInputProps,
) => {
  return (
    <Stack spacing="xs">
      <Select
        label={label}
        value={data.type}
        data={[
          { label: "Constant", value: "constant" },
          { label: "Linear", value: "linear" },
          { label: "Quadratic", value: "quadratic" },
          { label: "Exponential", value: "exponential" },
        ]}
        onChange={(value: AnyPositiveRange["type"] | null) =>
          // @ts-ignore
          // FIXME: This is incorrect, use default values or make properties optional.
          onChange({ type: value ?? "constant" })}
      />
      {data.type === "constant"
        ? (
          <ScientificInput
            value={data.value}
            onChange={(value) => onChange({ ...data, value })}
          />
        )
        : (
          <Group grow spacing="xs">
            <ScientificInput
              onChange={(from) => onChange({ ...data, from })}
              placeholder="From"
            />
            <ScientificInput
              onChange={(to) => onChange({ ...data, to })}
              placeholder="To"
            />
            <IntegerInput
              onChange={(steps) => onChange({ ...data, steps })}
              placeholder="Steps"
            />
          </Group>
        )}
    </Stack>
  );
};
