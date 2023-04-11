"use client";

import { Button, Center, Loader, Stack } from "@mantine/core";
import dynamic from "next/dynamic";
import { CSSProperties, useState } from "react";

import { Bolsig } from "./Bolsig";
import { BolsigInput, BolsigOutput } from "./io";

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
  input: BolsigInput;
  host: string;
  plotStyle?: CSSProperties;
}

const EedfPlot = (
  { energy, eedf, style }: {
    energy: Array<number>;
    eedf: Array<number>;
    style?: CSSProperties;
  },
) => (
  <LinePlot
    style={style}
    lines={[{ x: energy, y: eedf, color: "#1f77b4" }]}
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
  const [results, setResults] = useState<BolsigOutput>();

  return (
    <Stack align="center">
      {results
        ? <EedfPlot style={plotStyle} {...results} />
        : <EedfPlot style={plotStyle} energy={[]} eedf={[]} />}
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

          let result = await bolsig.solve(input);

          if (typeof result === "string") {
            console.log(result);
          } else {
            setResults(result);
            console.log(result);
          }
        }}
      >
        Compute
      </Button>
    </Stack>
  );
};
