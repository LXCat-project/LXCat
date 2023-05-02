"use client";

import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { Grid } from "@mantine/core";
import { useForm } from "@mantine/form";
import { BolsigComponent, BolsigInputForm } from "../../../solvers/bolsig";
import { BolsigFormInput } from "../../../solvers/bolsig/io";

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
    initialValues: BolsigFormInput.parse({}),
    validate: {
      composition: (composition) =>
        Object.values(composition).reduce(
          (total, fraction) => total + fraction,
          0,
        ) == 1,
    },
  });

  return (
    <Grid
      align="center"
      sx={theme => ({ margin: theme.spacing.xs })}
      grow
    >
      <Grid.Col span="auto" style={{ minWidth: 300, maxWidth: 500 }}>
        <BolsigInputForm consumedStates={consumedStates} config={form} />
      </Grid.Col>
      <Grid.Col span="content">
        <BolsigComponent
          plotStyle={{
            width: "100%",
            minWidth: 400,
            maxWidth: 800,
            aspectRatio: "7/6",
            overflowY: "hidden",
          }}
          host={bolsigHost}
          input={{
            ...form.values,
            crossSections: [
              legacy,
            ],
          }}
        />
      </Grid.Col>
    </Grid>
  );
};
