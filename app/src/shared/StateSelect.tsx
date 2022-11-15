// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Divider, Group, Sx, Button } from "@mantine/core";
import type {
  StateSummary,
  StateTree,
} from "@lxcat/database/dist/shared/queries/state";
import { LatexSelect } from "./LatexSelect";
import { mapObject } from "./utils";
import {
  OMIT_CHILDREN_KEY,
  StatePath,
} from "@lxcat/database/dist/shared/getStateLeaf";

function omitChildren([id, summary]: [string, StateSummary]): [string, string] {
  return [id, summary.latex];
}

interface StateSelectProps {
  data: StateTree;
  selected: StatePath;
  onChange: (selected: StatePath) => void | Promise<void>;
  inGroup?: boolean;
  sx?: Sx;
}

export const StateSelect = ({
  data,
  selected: { particle, electronic, vibrational, rotational },
  onChange,
  inGroup,
  sx,
}: StateSelectProps) => {
  const particleChange = (newParticle?: string) =>
    onChange({ particle: newParticle });
  const electronicChange = (newElectronic?: string) =>
    onChange({ particle, electronic: newElectronic });
  const vibrationalChange = (newVibrational?: string) =>
    onChange({ particle, electronic, vibrational: newVibrational });

  const rotationalChange = (newRotational?: string) =>
    onChange({ particle, electronic, vibrational, rotational: newRotational });

  const electronicEntries =
    particle && particle !== OMIT_CHILDREN_KEY
      ? data[particle].children
      : undefined;
  const vibrationalEntries =
    electronicEntries && electronic && electronic !== OMIT_CHILDREN_KEY
      ? electronicEntries[electronic].children
      : undefined;
  const rotationalEntries =
    vibrationalEntries && vibrational && vibrational !== OMIT_CHILDREN_KEY
      ? vibrationalEntries[vibrational].children
      : undefined;

  const component = (
    <Group
      spacing={0}
      sx={[
        (theme) => ({
          borderRadius: 4,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: theme.colors.gray[4],
          overflow: "hidden",
        }),
        sx,
      ]}
    >
      <LatexSelect
        choices={mapObject(data, omitChildren)}
        value={particle}
        onChange={particleChange}
        placeholder={"\\mathrm{Particle}"}
        clearable={true}
      />
      {electronicEntries && Object.keys(electronicEntries).length > 0 ? (
        <>
          <Divider orientation="vertical" color="gray.4" />
          <LatexSelect
            choices={{
              ...(data[particle!].valid ? { [OMIT_CHILDREN_KEY]: "-" } : {}),
              ...mapObject(electronicEntries, omitChildren),
            }}
            value={electronic}
            onChange={electronicChange}
            placeholder={"\\mathrm{Electronic}"}
            clearable={true}
          />
        </>
      ) : (
        <></>
      )}
      {vibrationalEntries && Object.keys(vibrationalEntries).length > 0 ? (
        <>
          <Divider orientation="vertical" color="gray.4" />
          <LatexSelect
            choices={{
              ...(electronicEntries![electronic!].valid
                ? { [OMIT_CHILDREN_KEY]: "-" }
                : {}),
              ...mapObject(vibrationalEntries, omitChildren),
            }}
            value={vibrational}
            onChange={vibrationalChange}
            placeholder={"\\mathrm{Vibrational}"}
            clearable={true}
          />
        </>
      ) : (
        <></>
      )}
      {rotationalEntries && Object.keys(rotationalEntries).length > 0 ? (
        <>
          <Divider orientation="vertical" color="gray.4" />
          <LatexSelect
            choices={{
              ...(vibrationalEntries![vibrational!].valid
                ? { [OMIT_CHILDREN_KEY]: "-" }
                : {}),
              ...mapObject(rotationalEntries, omitChildren),
            }}
            value={rotational}
            onChange={rotationalChange}
            placeholder={"\\mathrm{Rotational}"}
            clearable={true}
          />
        </>
      ) : (
        <></>
      )}
    </Group>
  );

  return (inGroup ?? true) &&
    electronicEntries &&
    Object.keys(electronicEntries).length > 0 ? (
    <Button.Group>{component}</Button.Group>
  ) : (
    component
  );
};
