// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IntegerInput } from "@/shared/forms/integer-input";
import { RangeInputForm } from "@/shared/forms/range-input-form";
import { ScientificInput } from "@/shared/forms/scientific-input";
import { Latex, LatexText } from "@/shared/latex";
import { type SerializedSpecies } from "@lxcat/schema/species";
import { Card, Select, Stack, Title } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { BolsigFormInput } from "./io";

export interface BolsigInputFormProps {
  consumedStates: Array<SerializedSpecies>;
  config: UseFormReturnType<Omit<BolsigFormInput, "crossSections">>;
}

export const BolsigInputForm = (
  { config, consumedStates }: BolsigInputFormProps,
) => {
  return (
    <Stack gap="xs" style={{ minWidth: 300, maxWidth: 500 }}>
      <Card withBorder padding="xs">
        <Title order={3}>General</Title>
        <Stack gap="xs">
          <RangeInputForm
            label={
              <LatexText>{"Reduced electric field $(\\mathrm{Td})$"}</LatexText>
            }
            form={config}
            basePath="config.reducedField"
          />
          <ScientificInput
            {...config.getInputProps("config.ionizationDegree")}
            label="Ionization degree"
          />
          <ScientificInput
            {...config.getInputProps("config.plasmaDensity")}
            label={
              <LatexText>{"Plasma density $(\\mathrm{m}^{-3})$"}</LatexText>
            }
          />
          <ScientificInput
            {...config.getInputProps("config.gasTemperature")}
            label={<LatexText>{"Gas temperature $(\\mathrm{K})$"}</LatexText>}
          />
        </Stack>
      </Card>
      <Card withBorder padding="xs">
        <Title order={3}>Gas mole fractions</Title>
        <Stack gap="xs">
          {consumedStates.map(state => (
            <ScientificInput
              key={state.serialized.summary}
              {...config.getInputProps(
                `composition.${state.serialized.summary}`,
              )}
              value={consumedStates.length == 1 ? 1 : 0}
              label={<Latex>{state.serialized.latex}</Latex>}
            />
          ))}
        </Stack>
      </Card>
      <Card withBorder padding="xs">
        <Title order={3}>Numerics</Title>
        <Stack gap="xs">
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
              label={<LatexText>{"Maximum energy $(\\mathrm{eV})$"}</LatexText>}
            />
          )}
        </Stack>
      </Card>
    </Stack>
  );
};
