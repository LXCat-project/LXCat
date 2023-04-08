"use client";

import { Button } from "@mantine/core";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Bolsig } from "./Bolsig";
import { BolsigInput, BolsigOutput } from "./io";

const LinePlot = dynamic(
  async () => import("../../shared/LinePlot").then(({ LinePlot }) => LinePlot),
  { ssr: false },
);

export interface BolsigProps {
  input: BolsigInput;
  host: string;
}

export const BolsigComponent = ({ input, host }: BolsigProps) => {
  const [solver, setSolver] = useState<Bolsig>();
  const [results, setResults] = useState<BolsigOutput>();

  return (
    <>
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
      {results && (
        <LinePlot
          lines={[{ x: results.energy, y: results.eedf, color: "#1f77b4" }]}
          xAxis={{
            label: "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
            type: "log",
          }}
          yAxis={{
            label: "$\\text{EEDF } \\left(\\mathrm{eV}^{-3/2}\\right)$",
            type: "log",
          }}
        />
      )}
    </>
  );
};
