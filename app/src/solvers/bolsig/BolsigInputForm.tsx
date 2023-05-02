"use client";

import { Card, Select, Stack, Title } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import Latex from "react-latex-next";
import { BolsigFormInput } from "./io";
import "katex/dist/katex.min.css";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { IntegerInput } from "../../shared/IntegerInput";
import { RangeInput } from "../../shared/RangeInput";
import { ScientificInput } from "../../shared/ScientificInput";

export interface BolsigInputFormProps {
  consumedStates: Array<State>;
  config: UseFormReturnType<Omit<BolsigFormInput, "crossSections">>;
}

export const BolsigInputForm = (
  { config, consumedStates }: BolsigInputFormProps,
) => {
  return (
    <Stack spacing="xs" sx={{ minWidth: 300, maxWidth: 500 }}>
      <Card withBorder padding="xs">
        <Title order={3}>General</Title>
        <Stack spacing="xs">
          {
            // <ScientificInput
            //   {...config.getInputProps("config.reducedField")}
            //   label={<Latex>{"Reduced electric field $(\\mathrm{Td})$"}</Latex>}
            // />
          }
          <RangeInput
            {...config.getInputProps("config.reducedField")}
            label={<Latex>{"Reduced electric field $(\\mathrm{Td})$"}</Latex>}
          />
          <ScientificInput
            {...config.getInputProps("config.ionizationDegree")}
            label={<Latex>{"Ionization degree"}</Latex>}
          />
          <ScientificInput
            {...config.getInputProps("config.plasmaDensity")}
            label={<Latex>{"Plasma density $(\\mathrm{m}^{-3})$"}</Latex>}
          />
          <ScientificInput
            {...config.getInputProps("config.gasTemperature")}
            label={<Latex>{"Gas temperature $(\\mathrm{K})$"}</Latex>}
          />
        </Stack>
      </Card>
      <Card withBorder padding="xs">
        <Title order={3}>Gas mole fractions</Title>
        <Stack spacing="xs">
          {consumedStates.map(state => (
            <ScientificInput
              key={state.id}
              {...config.getInputProps(`composition.${state.id}`)}
              value={consumedStates.length == 1 ? 1 : 0}
              label={<Latex>{`$${state.latex}$`}</Latex>}
            />
          ))}
        </Stack>
      </Card>
      <Card withBorder padding="xs">
        <Title order={3}>Numerics</Title>
        <Stack spacing="xs">
          <Select
            label="Grid type"
            {...config.getInputProps("numerics.grid.type")}
            data={[
              { value: "automatic", label: "Automatic" },
              { value: "linear", label: "Linear" },
              { value: "quadratic", label: "Quadratic" },
            ]}
          >
          </Select>
          <IntegerInput
            {...config.getInputProps("numerics.grid.size")}
            label="Grid size"
          />
          {config.getInputProps("numerics.grid.type").value !== "automatic" && (
            <ScientificInput
              {...config.getInputProps("numerics.grid.maxEnergy")}
              label={<Latex>{"Maximum energy $(\\mathrm{eV})$"}</Latex>}
            />
          )}
        </Stack>
      </Card>
    </Stack>
  );
};
