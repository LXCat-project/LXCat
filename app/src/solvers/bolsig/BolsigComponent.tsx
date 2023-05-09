"use client";

import { Button, Center, Loader, Stack } from "@mantine/core";
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

export const BolsigComponent = ({ input, host, plotStyle }: BolsigProps) => {
  const [solver, setSolver] = useState<Bolsig>();
  const [results, setResults] = useState<
    Record<
      number,
      { reducedField: number; output: BolsigOutput; color: string }
    >
  >();
  const [error, setError] = useState<Maybe<Error>>(Maybe.nothing());

  if (error.isJust) throw error.value;

  return (
    <Stack align="center">
      {results
        ? (
          <EedfPlot
            style={plotStyle}
            lines={Object.values(results).map(({ output, color }) => ({
              ...output,
              color,
            }))}
          />
        )
        : <EedfPlot style={plotStyle} lines={[]} />}
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
