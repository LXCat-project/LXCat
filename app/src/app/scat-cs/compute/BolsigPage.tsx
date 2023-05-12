// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { Button, Grid, Stack } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useState } from "react";
import { Maybe } from "true-myth";
import { ErrorDialog } from "../../../shared/ErrorDialog";
import { Bolsig, BolsigInputForm, BolsigPlot } from "../../../solvers/bolsig";
import {
  BolsigFormInput,
  BolsigInput,
  BolsigOutput,
} from "../../../solvers/bolsig/io";

export interface BolsigPageProps {
  data: CrossSectionBag;
  references: Array<{ ref: string; url?: string }>;
  legacy: string;
  bolsigHost: string;
  consumedStates: Array<State>;
}

export const BolsigPage = (
  { bolsigHost, consumedStates, legacy }: BolsigPageProps,
) => {
  const form = useForm<Omit<BolsigFormInput, "crossSections">>({
    initialValues: BolsigFormInput.parse({
      composition: consumedStates.length === 1
        ? { [consumedStates[0].id]: 1 }
        : Object.fromEntries(consumedStates.map((state) => [state.id, 0])),
    }),
    validate: zodResolver(BolsigFormInput.omit({ crossSections: true })),
  });

  const [results, setResults] = useState<
    Array<{ id: number; reducedField: number; output: BolsigOutput }>
  >([]);

  // The solver is treated as a singleton.
  const [solver, setSolver] = useState<Bolsig>();
  const [error, setError] = useState<Maybe<Error>>(Maybe.nothing());

  const run = async () => {
    let bolsig: Bolsig;

    if (form.validate().hasErrors) {
      setError(
        Maybe.just(
          new Error("The provided form input is incorrect or incomplete."),
        ),
      );
      return;
    }

    if (!solver) {
      bolsig = new Bolsig(
        BolsigInput,
        BolsigOutput,
        bolsigHost,
      );
      setSolver(bolsig);
    } else {
      bolsig = solver;
    }

    const input = {
      ...form.values,
      crossSections: [
        legacy,
      ],
    };

    const parseResult = bolsig.inputSchema.safeParse(input);

    if (!parseResult.success) {
      setError(Maybe.just(parseResult.error));
      return;
    }

    setResults([]);

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
          setResults((results) => [
            ...results,
            {
              id: index,
              reducedField: parseResult.data.config.reducedField[index],
              output: output.value,
            },
          ]);
        }
      });
    });
  };

  return (
    <>
      {error.isJust && (
        <ErrorDialog
          opened={true}
          error={error.value}
          onClose={() => setError(Maybe.nothing())}
        />
      )}
      <Grid
        align="center"
        sx={theme => ({ margin: theme.spacing.xs })}
        grow
      >
        <Grid.Col span="auto" style={{ minWidth: 300, maxWidth: 500 }}>
          <BolsigInputForm consumedStates={consumedStates} config={form} />
        </Grid.Col>
        <Grid.Col span="content">
          <Stack align="center">
            <BolsigPlot
              results={results}
              plotStyle={{
                width: "100%",
                minWidth: 400,
                maxWidth: 800,
                aspectRatio: "7/6",
                overflowY: "hidden",
              }}
            />
            <Button onClick={run}>Compute</Button>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
};
