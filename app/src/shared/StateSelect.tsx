import { Button } from "@mantine/core";
import { LatexSelect } from "./LatexSelect";

export type StateSummary = { latex: string; children?: StateTree };
export type StateTree = Record<string, StateSummary>;

function mapObject<T, R>(
  obj: Record<string, T>,
  callback: (pair: [string, T]) => [string, R]
): Record<string, R> {
  return Object.fromEntries(Object.entries(obj).map(callback));
}

function omitChildren([id, summary]: [string, StateSummary]): [string, string] {
  return [id, summary.latex];
}

export interface StateSelection {
  particle?: string;
  electronic?: string;
  vibrational?: string;
  rotational?: string;
}
interface StateSelectProps {
  data: StateTree;
  selected: StateSelection;
  onChange: (selected: StateSelection) => void;
  inGroup?: boolean;
}

export const StateSelect = ({
  data,
  selected: { particle, electronic, vibrational, rotational },
  onChange,
  inGroup,
}: StateSelectProps) => {
  const particleChange = (newParticle: string) => {
    onChange({ particle: newParticle });
  };
  const electronicChange = (newElectronic: string) => {
    onChange({ particle, electronic: newElectronic });
  };
  const vibrationalChange = (newVibrational: string) => {
    onChange({ particle, electronic, vibrational: newVibrational });
  };
  const rotationalChange = (newRotational: string) => {
    onChange({ particle, electronic, vibrational, rotational: newRotational });
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

  const component = (
    <>
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
        <></>
      )}
      {vibrationalEntries && Object.keys(vibrationalEntries).length > 0 ? (
        <LatexSelect
          choices={mapObject(vibrationalEntries, omitChildren)}
          value={vibrational}
          onChange={vibrationalChange}
        />
      ) : (
        <></>
      )}
      {rotationalEntries && Object.keys(rotationalEntries).length > 0 ? (
        <LatexSelect
          choices={mapObject(rotationalEntries, omitChildren)}
          value={rotational}
          onChange={rotationalChange}
        />
      ) : (
        <></>
      )}
    </>
  );

  return (inGroup ?? true) &&
    electronicEntries &&
    Object.keys(electronicEntries).length > 0 ? (
    <Button.Group>{component}</Button.Group>
  ) : (
    component
  );
};
