"use client";

import { Button, Center, Loader, Stack, Tabs } from "@mantine/core";
import dynamic from "next/dynamic";
import { CSSProperties, useState } from "react";
import { Maybe } from "true-myth";
import { colorScheme } from "../../app/scat-cs/bag/colors";

import { Bolsig } from "./bolsig";
import { BolsigFormInput, BolsigInput, BolsigOutput } from "./io";

const LinePlot = dynamic(
  async () => import("../../shared/LinePlot").then(({ LinePlot }) => LinePlot),
  {
    loading: () => (
      <div style={{ width: "100%", height: "100%" }}>
        <Center>
          <Loader />
        </Center>
      </div>
    ),
    ssr: false,
  },
);

export interface BolsigProps {
  input: BolsigFormInput;
  host: string;
  plotStyle?: CSSProperties;
}

const EedfPlot = (
  { lines, style }: {
    lines: Array<{ energy: Array<number>; eedf: Array<number>; color: string }>;
    style?: CSSProperties;
  },
) => (
  <LinePlot
    style={style}
    lines={lines.map(({ energy, eedf, color }) => ({
      x: energy,
      y: eedf,
      color,
    }))}
    xAxis={{
      label: "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
      type: "log",
    }}
    yAxis={{
      label: "$\\text{EEDF } \\left(\\mathrm{eV}^{-3/2}\\right)$",
      type: "log",
    }}
  />
);

const plotConfig: Record<
  ParameterKeys,
  { label: string; xLog?: boolean; yLog?: boolean }
> = {
  diffusion: {
    label: "$\\text{Reduced diffusion coefficient } \\left((ms)^{-1}\\right)$",
    xLog: true,
    yLog: false,
  },
  mobility: {
    label: "$\\text{Reduced mobility } \\left((mVs)^{-1}\\right)$",
    xLog: true,
    yLog: false,
  },
};

const ParameterPlot = (
  { parameter, values, style }: {
    parameter: "diffusion" | "mobility";
    values: Array<{ reducedField: number; value: number }>;
    style?: CSSProperties;
  },
) => {
  const config = plotConfig[parameter];

  return (
    <LinePlot
      style={style}
      lines={[{
        x: values.map(({ reducedField }) => reducedField),
        y: values.map(({ value }) => value),
        color: colorScheme[0],
      }]}
      xAxis={{
        label: "$\\text{Reduced electric field}\\left(\\mathrm{Td}\\right)$",
        type: config.xLog ? "log" : "linear",
      }}
      yAxis={{
        label: config.label,
        type: config.yLog ? "log" : "linear",
      }}
    />
  );
};

type OutputMode = "eedf" | ParameterKeys;
type ParameterKeys = "diffusion" | "mobility";

const OutputModes = ["eedf", "diffusion", "mobility"] as const;

export const BolsigComponent = ({ input, host, plotStyle }: BolsigProps) => {
  const [solver, setSolver] = useState<Bolsig>();
  const [results, setResults] = useState<
    Record<
      number,
      { reducedField: number; output: BolsigOutput; color: string }
    >
  >();
  const [error, setError] = useState<Maybe<Error>>(Maybe.nothing());
  const [outputMode, setOutputMode] = useState<OutputMode>("mobility");

  if (error.isJust) throw error.value;

  const makeOutput = (mode: OutputMode) => {
    switch (mode) {
      case "eedf":
        return results
          ? (
            <EedfPlot
              style={plotStyle}
              lines={Object.values(results).map(({ output, color }) => ({
                ...output,
                color,
              }))}
            />
          )
          : <EedfPlot style={plotStyle} lines={[]} />;
      default:
        return results
          ? (
            <ParameterPlot
              parameter={mode}
              style={plotStyle}
              values={Object.values(results).map((
                { reducedField, output: { swarm } },
              ) => ({ reducedField, value: swarm[mode] }))}
            />
          )
          : <ParameterPlot parameter={mode} style={plotStyle} values={[]} />;
    }
  };

  return (
    <Stack align="center">
      <Tabs sx={{ width: "90%", height: "100%" }}>
        <Tabs.List>
          {OutputModes.map((mode) => (
            <Tabs.Tab key={`header.${mode}`} value={mode}>Test</Tabs.Tab>
          ))}
        </Tabs.List>
        {OutputModes.map((mode) => (
          <Tabs.Panel key={`content.${mode}`} value={mode}>
            <Center>
              {makeOutput(mode)}
            </Center>
          </Tabs.Panel>
        ))}
      </Tabs>
      <Button
        onClick={async () => {
          let bolsig: Bolsig;

          if (!solver) {
            bolsig = new Bolsig(
              BolsigInput,
              BolsigOutput,
              host,
            );
            setSolver(bolsig);
          } else {
            bolsig = solver;
          }

          const parseResult = bolsig.inputSchema.safeParse(input);

          if (!parseResult.success) {
            setError(Maybe.just(parseResult.error));
            return;
          }

          setResults(() => []);

          const solveResult = await bolsig.solve(parseResult.data);

          if (solveResult.isErr) {
            setError(Maybe.just(solveResult.error));
            return;
          }

          const outputs = solveResult.value;

          outputs.forEach((output, index) => {
            output.then(output => {
              if (output.isErr) {
                setError(Maybe.just(output.error));
              } else {
                setResults((results) => ({
                  ...results,
                  [index]: {
                    reducedField: parseResult.data.config.reducedField[index],
                    output: output.value,
                    color: colorScheme[index % colorScheme.length],
                  },
                }));
              }
            });
          });
        }}
      >
        Compute
      </Button>
    </Stack>
  );
};
