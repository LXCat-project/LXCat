"use client";

import { Card, Select, Stack, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import Latex from "react-latex-next";
import { BolsigInput } from "./io";
import "katex/dist/katex.min.css";
import { IntegerInput } from "../../shared/IntegerInput";
import { ScientificInput } from "../../shared/ScientificInput";

export const BolsigInputForm = () => {
  const config = useForm<BolsigInput>({ initialValues: BolsigInput.parse({}) });

  return (
    <>
      <Card withBorder padding="xs" sx={{ margin: 10, width: "50%" }}>
        <Title order={3}>General</Title>
        <Stack spacing="xs">
          <ScientificInput
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
      <Card withBorder padding="xs" sx={{ margin: 10, width: "50%" }}>
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
      <button
        onClick={() => {
          console.log(config.values);
        }}
      >
        print
      </button>
    </>
  );
};
