// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  OMIT_CHILDREN_KEY,
  StatePath,
  StateSummary,
  StateTree,
} from "@lxcat/database/shared";
import { MantineStyleProp } from "@mantine/core";
import clsx from "clsx";
import { Latex } from "./Latex";
import { LatexSelect } from "./LatexSelect";
import classes from "./state-select.module.css";
import { mapObject } from "./utils";

function omitChildren([id, summary]: [string, StateSummary]): [string, string] {
  return [id, summary.latex];
}

const Placeholder = (value: string) => (
  <Latex className={classes.placeholder}>{value}</Latex>
);

type StateSelectProps = {
  data: StateTree;
  selected: StatePath;
  onChange: (selected: StatePath) => void | Promise<void>;
  style?: MantineStyleProp;
};

export const StateSelect = ({
  data,
  selected: { particle, electronic, vibrational, rotational },
  onChange,
}: StateSelectProps) => {
  const particleChange = (newParticle?: string) =>
    onChange({ particle: newParticle });
  const electronicChange = (newElectronic?: string) =>
    onChange({ particle, electronic: newElectronic });
  const vibrationalChange = (newVibrational?: string) =>
    onChange({ particle, electronic, vibrational: newVibrational });

  const rotationalChange = (newRotational?: string) =>
    onChange({ particle, electronic, vibrational, rotational: newRotational });

  const electronicEntries = particle && particle !== OMIT_CHILDREN_KEY
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

  const hasElectronic = electronicEntries
    && Object.keys(electronicEntries).length > 0;
  const hasVibrational = vibrationalEntries
    && Object.keys(vibrationalEntries).length > 0;
  const hasRotational = rotationalEntries
    && Object.keys(rotationalEntries).length > 0;

  const component = (
    <>
      <LatexSelect
        data={mapObject(data, omitChildren)}
        value={particle}
        onChange={particleChange}
        placeholder={Placeholder("\\mathrm{Particle}")}
        // TODO make name unique between StateSelect instances
        name="particle-select"
        clearable
        className={clsx(classes.dropdown, classes.end, {
          [classes.middle]: hasElectronic,
        })}
      />
      {hasElectronic
        ? (
          <LatexSelect
            data={{
              ...(data[particle!].valid ? { [OMIT_CHILDREN_KEY]: "-" } : {}),
              ...mapObject(electronicEntries, omitChildren),
            }}
            value={electronic}
            onChange={electronicChange}
            placeholder={Placeholder("\\mathrm{Electronic}")}
            clearable
            className={clsx(classes.dropdown, classes.end, {
              [classes.middle]: hasVibrational,
            })}
          />
        )
        : <></>}
      {hasVibrational
        ? (
          <LatexSelect
            data={{
              ...(electronicEntries![electronic!].valid
                ? { [OMIT_CHILDREN_KEY]: "-" }
                : {}),
              ...mapObject(vibrationalEntries, omitChildren),
            }}
            value={vibrational}
            onChange={vibrationalChange}
            placeholder={Placeholder("\\mathrm{Vibrational}")}
            clearable
            className={clsx(classes.dropdown, classes.end, {
              [classes.middle]: hasRotational,
            })}
          />
        )
        : <></>}
      {hasRotational
        ? (
          <LatexSelect
            data={{
              ...(vibrationalEntries![vibrational!].valid
                ? { [OMIT_CHILDREN_KEY]: "-" }
                : {}),
              ...mapObject(rotationalEntries, omitChildren),
            }}
            value={rotational}
            onChange={rotationalChange}
            placeholder={Placeholder("\\mathrm{Rotational}")}
            clearable
            className={clsx(classes.dropdown, classes.end)}
          />
        )
        : <></>}
    </>
  );

  return component;
};
