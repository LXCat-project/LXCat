import { Button } from "@mantine/core";
import { Fragment, useState } from "react";
import { LatexSelect } from "./LatexSelect";

export type StateSummary = { latex: string; children?: StateTree };
export type StateTree = Record<string, StateSummary>;

interface StateSelectProps {
  data: StateTree;
}

function mapObject<T, R>(
  obj: Record<string, T>,
  callback: (pair: [string, T]) => [string, R]
): Record<string, R> {
  return Object.fromEntries(Object.entries(obj).map(callback));
}

function omitChildren([id, summary]: [string, StateSummary]): [string, string] {
  return [id, summary.latex];
}

export const StateSelect = ({ data }: StateSelectProps) => {
  const [particle, setParticle] = useState<string>();
  const [electronic, setElectronic] = useState<string>();
  const [vibrational, setVibrational] = useState<string>();
  const [rotational, setRotational] = useState<string>();

  const particleChange = (newParticle: string) => {
    setParticle(newParticle);
    setElectronic(undefined);
    setVibrational(undefined);
    setRotational(undefined);
  };
  const electronicChange = (newElectronic: string) => {
    setElectronic(newElectronic);
    setVibrational(undefined);
    setRotational(undefined);
  };
  const vibrationalChange = (newVibrational: string) => {
    setVibrational(newVibrational);
    setRotational(undefined);
  };

  const electronicEntries = particle ? data[particle].children : undefined;
  const vibrationalEntries =
    electronicEntries && electronic
      ? electronicEntries[electronic].children
      : undefined;
  const rotationalEntries =
    vibrationalEntries && vibrational
      ? vibrationalEntries[vibrational].children
      : undefined;

  return (
    <Button.Group>
      <LatexSelect
        choices={mapObject(data, omitChildren)}
        value={particle}
        onChange={particleChange}
      />
      {electronicEntries && Object.keys(electronicEntries).length > 0 ? (
        <LatexSelect
          choices={mapObject(electronicEntries, omitChildren)}
          value={electronic}
          onChange={electronicChange}
        />
      ) : (
        <Fragment />
      )}
      {vibrationalEntries && Object.keys(vibrationalEntries).length > 0 ? (
        <LatexSelect
          choices={mapObject(vibrationalEntries, omitChildren)}
          value={vibrational}
          onChange={vibrationalChange}
        />
      ) : (
        <Fragment />
      )}
      {rotationalEntries &&Object.keys(rotationalEntries).length > 0? (
        <LatexSelect
          choices={mapObject(rotationalEntries, omitChildren)}
          value={rotational}
          onChange={setRotational}
        />
      ) : (
        <Fragment />
      )}
    </Button.Group>
  );
};
