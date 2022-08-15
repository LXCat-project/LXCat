import {
  AtomLS,
  Electronic,
  HomonuclearDiatom,
  LinearTriatomInversionCenter,
  ParticleLessStateChoice,
  StateChoice,
  StateSelected,
  Vibrational,
} from "@lxcat/database/dist/shared/queries/state";
import { ChangeEventHandler, useState } from "react";

const MultiSelect = ({
  value,
  choices,
  onChange,
  label,
}: {
  label: string;
  value: string[];
  choices: string[];
  onChange: (newValue: string[]) => void;
}) => {
  if (choices.length < 2) {
    return <></>;
  }
  const onMyChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const newValue = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    onChange(newValue);
  };
  return (
    <label>
      {label}
      <select multiple value={value} onChange={onMyChange}>
        {choices.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
};

const ChargeFilter = ({
  choices,
  value,
  onChange,
}: {
  choices: number[];
  value: number[];
  onChange: (newValue: number[]) => void;
}) => {
  const onChargeChange = (newValue: string[]) => {
    onChange(newValue.map(parseInt));
  };
  if (choices.length === 1) {
    return (
      <label>
        Charge
        <input
          type="checkbox"
          checked={value[0] === choices[0]}
          onChange={() => onChange(value[0] === undefined ? [choices[0]] : [])}
        />
        {choices[0]}
      </label>
    );
  }
  return (
    <MultiSelect
      label="Charge"
      choices={choices.map((o) => o.toString())}
      value={value.map((o) => o.toString())}
      onChange={onChargeChange}
    />
  );
};

const VibrationalFilter = ({
  choices,
  value,
  onChange,
}: {
  choices: Array<Vibrational> | undefined;
  value: Array<Vibrational> | undefined;
  onChange: (newValue: Array<Vibrational> | undefined) => void;
}) => {
  function onVibrationalChange(
    checked: boolean,
    index: number,
    newValue: Vibrational
  ) {
    if (value === undefined) {
      return;
    }
    if (checked && index === -1) {
      onChange([...value, newValue]);
    } else if (!checked && index !== -1) {
      const newValues = [...value];
      newValues.splice(index, 1);
      onChange(newValues);
    } else {
      throw new Error("How did you get here?");
    }
  }
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value !== undefined}
          onChange={() => onChange(value === undefined ? [] : undefined)}
        />
        Vibrational
      </label>
      {value === undefined || choices === undefined ? (
        <></>
      ) : (
        <fieldset>
          {choices.map((c) => {
            const vJoined = c.v.join(", ");
            const valueIndex = value.findIndex(
              (d) => d.v.join(", ") === vJoined
            );
            return (
              <label key={vJoined}>
                <input
                  type="checkbox"
                  checked={valueIndex !== -1}
                  onChange={(e) =>
                    onVibrationalChange(e.target.checked, valueIndex, c)
                  }
                />
                v = {vJoined}
              </label>
            );
          })}
        </fieldset>
      )}
    </div>
  );
};

const HomonuclearDiatomFilter = ({
  value,
  onChange,
  choices,
}: {
  choices: HomonuclearDiatom;
  value: HomonuclearDiatom | undefined;
  onChange: (newValue: HomonuclearDiatom | undefined) => void;
}) => {
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value !== undefined}
          onChange={() =>
            onChange(
              value === undefined
                ? {
                    type: "HomonuclearDiatom",
                    e: [],
                    Lambda: [],
                    S: [],
                    parity: [],
                    reflection: [],
                    vibrational: undefined,
                  }
                : undefined
            )
          }
        />
        HomonuclearDiatom
      </label>
      {value === undefined ? (
        <></>
      ) : (
        <div>
          <div style={{ display: "flex" }}>
            <div>
              <MultiSelect
                label="e"
                choices={choices.e}
                value={value.e}
                onChange={(newValue: string[]) =>
                  onChange({ ...value, e: newValue })
                }
              />
            </div>
            <div>
              <MultiSelect
                label="Lambda"
                choices={choices.Lambda.map((v) => v.toString())}
                value={value.Lambda.map((v) => v.toString())}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    Lambda: newValue.map(parseInt),
                  })
                }
              />
            </div>
            <div>
              <MultiSelect
                label="Parity"
                choices={choices.parity}
                value={value.parity}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    parity: newValue as Array<"g" | "u">, // TODO perform check
                  })
                }
              />
            </div>
            <div>
              <MultiSelect
                label="Reflection"
                choices={choices.reflection}
                value={value.reflection}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    reflection: newValue as Array<"+" | "-">, // TODO perform check
                  })
                }
              />
            </div>
          </div>
          <VibrationalFilter
            choices={choices.vibrational}
            value={value.vibrational}
            onChange={(newValue: Array<Vibrational> | undefined) =>
              onChange({
                ...value,
                vibrational: newValue,
              })
            }
          />
        </div>
      )}
    </div>
  );
};

const AtomLSFilter = ({
  value,
  onChange,
  choices,
}: {
  choices: AtomLS;
  value: AtomLS | undefined;
  onChange: (newValue: AtomLS | undefined) => void;
}) => {
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value !== undefined}
          onChange={() =>
            onChange(
              value === undefined
                ? {
                    type: "AtomLS",
                    term: {
                      L: [],
                      S: [],
                      P: [],
                      J: [],
                    },
                  }
                : undefined
            )
          }
        />
        AtomLS
      </label>
      {value === undefined ? (
        <></>
      ) : (
        <div>
          <span>Term</span>
          <div style={{ display: "flex" }}>
            <div>
              <MultiSelect
                label="L"
                choices={choices.term.L.map((v) => v.toString())}
                value={value.term.L.map((v) => v.toString())}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    term: { ...value.term, L: newValue.map(parseInt) },
                  })
                }
              />
            </div>
            <div>
              <MultiSelect
                label="S"
                choices={choices.term.S.map((v) => v.toString())}
                value={value.term.S.map((v) => v.toString())}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    term: { ...value.term, S: newValue.map(parseInt) },
                  })
                }
              />
            </div>
            <div>
              {/* TODO replace with 2 checkboxes as can only be -1 or 1 */}
              <MultiSelect
                label="P"
                choices={choices.term.P.map((v) => v.toString())}
                value={value.term.P.map((v) => v.toString())}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    term: {
                      ...value.term,
                      P: newValue.map(parseInt) as Array<1 | -1>,
                    },
                  })
                }
              />
            </div>
            <div>
              {/* TODO add Total angular specifier as title */}
              <MultiSelect
                label="J"
                choices={choices.term.J.map((v) => v.toString())}
                value={value.term.J.map((v) => v.toString())}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    term: { ...value.term, J: newValue.map(parseInt) },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LinearTriatomInversionCenterFilter = ({
  value,
  onChange,
  choices,
}: {
  choices: LinearTriatomInversionCenter;
  value: LinearTriatomInversionCenter | undefined;
  onChange: (newValue: LinearTriatomInversionCenter | undefined) => void;
}) => {
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value !== undefined}
          onChange={() =>
            onChange(
              value === undefined
                ? {
                    type: "LinearTriatomInversionCenter",
                    e: [],
                    Lambda: [],
                    S: [],
                    parity: [],
                    reflection: [],
                  }
                : undefined
            )
          }
        />
        LinearTriatomInversionCenter
      </label>
      {value === undefined ? (
        <></>
      ) : (
        <div>
          <div style={{ display: "flex" }}>
            <div>
              <MultiSelect
                label="e"
                choices={choices.e}
                value={value.e}
                onChange={(newValue: string[]) =>
                  onChange({ ...value, e: newValue })
                }
              />
            </div>
            <div>
              <MultiSelect
                label="Lambda"
                choices={choices.Lambda.map((v) => v.toString())}
                value={value.Lambda.map((v) => v.toString())}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    Lambda: newValue.map(parseInt),
                  })
                }
              />
            </div>
            <div>
              <MultiSelect
                label="Parity"
                choices={choices.parity}
                value={value.parity}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    parity: newValue as Array<"g" | "u">, // TODO perform check
                  })
                }
              />
            </div>
            <div>
              <MultiSelect
                label="Reflection"
                choices={choices.reflection}
                value={value.reflection}
                onChange={(newValue: string[]) =>
                  onChange({
                    ...value,
                    reflection: newValue as Array<"+" | "-">, // TODO perform check
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ElectronicTypeFilter = ({
  value,
  onChange,
  choices,
}: {
  choices: Electronic;
  value: Electronic | undefined;
  onChange: (newValue: Electronic | undefined) => void;
}) => {
  if (
    choices.type === "HomonuclearDiatom" &&
    (value === undefined || value.type === "HomonuclearDiatom")
  ) {
    return (
      <HomonuclearDiatomFilter
        value={value}
        choices={choices}
        onChange={onChange}
      />
    );
  }
  if (
    choices.type === "AtomLS" &&
    (value === undefined || value.type === "AtomLS")
  ) {
    return <AtomLSFilter value={value} choices={choices} onChange={onChange} />;
  }
  if (
    choices.type === "LinearTriatomInversionCenter" &&
    (value === undefined || value.type === "LinearTriatomInversionCenter")
  ) {
    return (
      <LinearTriatomInversionCenterFilter
        value={value}
        choices={choices}
        onChange={onChange}
      />
    );
  }

  return <div>Unknown electronic type</div>;
};

const EletronicFilter = ({
  value,
  onChange,
  choices,
}: {
  choices: Array<Electronic> | undefined;
  value: Array<Electronic> | undefined;
  onChange: (newValue: Array<Electronic> | undefined) => void;
}) => {
  const onInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.checked) {
      onChange([]);
    } else {
      onChange(undefined);
    }
  };
  function onTypeChange(type: string, newValue: Electronic | undefined) {
    if (value === undefined) {
      return;
    }
    const eIndex = value.findIndex((v) => v.type === type);
    if (eIndex === -1) {
      if (newValue === undefined) {
        // nothing to do, type already unselected
      } else {
        onChange([...value, newValue]);
      }
    } else {
      if (newValue === undefined) {
        const newValues = [...value];
        newValues.splice(eIndex, 1);
        onChange(newValues);
      } else {
        const newValues = [...value];
        newValues[eIndex] = newValue;
        onChange(newValues);
      }
    }
  }
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value !== undefined}
          onChange={onInputChange}
        />
        Electronic
      </label>
      {value === undefined || choices === undefined ? (
        <></>
      ) : (
        <fieldset>
          {choices.map((e) => {
            const esel = value.find((v) => v.type === e.type);
            return (
              <ElectronicTypeFilter
                key={e.type}
                choices={e}
                value={esel}
                onChange={(n) => onTypeChange(e.type, n)}
              />
            );
          })}
        </fieldset>
      )}
    </div>
  );
};

const ParticleFilter = ({
  particle,
  selected,
  onChange,
  choices,
}: {
  particle: string;
  selected: undefined | ParticleLessStateChoice;
  choices: ParticleLessStateChoice;
  onChange: (newSelection: ParticleLessStateChoice | undefined) => void;
}) => {
  function onParticleChange() {
    if (selected === undefined) {
      onChange({ charge: [], electronic: undefined });
    } else {
      onChange(undefined);
    }
  }
  const onChargeChange = (newCharges: number[]) => {
    if (selected === undefined) {
      return;
    }
    onChange({ ...selected, charge: newCharges });
  };
  const onElectronicChange = (newElectronic: Array<Electronic> | undefined) => {
    if (selected === undefined) {
      return;
    }
    if (newElectronic === undefined) {
      onChange({ ...selected, electronic: undefined });
    } else {
      onChange({ ...selected, electronic: newElectronic });
    }
  };
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={selected !== undefined}
          onChange={onParticleChange}
        />
        {particle}
      </label>
      {selected === undefined ? (
        <></>
      ) : (
        <fieldset>
          {choices.charge.length > 1 && (
            <ChargeFilter
              choices={choices.charge}
              value={selected.charge}
              onChange={onChargeChange}
            />
          )}
          {choices.electronic !== undefined && (
            <EletronicFilter
              value={selected.electronic}
              choices={choices.electronic}
              onChange={onElectronicChange}
            />
          )}
        </fieldset>
      )}
    </li>
  );
};

export interface Props {
  choices: StateChoice[];
  selected: StateSelected;
  onChange: (newSelection: StateSelected) => void;
}

export const StateFilter = ({
  choices,
  selected: initialSelected,
  onChange,
}: Props) => {
  const [selected, setSelected] = useState(initialSelected);

  function onStateChange(
    particle: string,
    selection: ParticleLessStateChoice | undefined
  ) {
    let newSelected: StateSelected;
    if (selection === undefined) {
      const { [particle]: _particle2drop, ...inner } = selected;
      newSelected = inner;
    } else {
      newSelected = { ...selected };
      newSelected[particle] = selection;
    }
    setSelected(newSelected);
    onChange(newSelected);
  }
  return (
    <ul>
      {choices.map((s) => {
        const { particle, ...particleChoices } = s;
        return (
          <ParticleFilter
            key={particle}
            onChange={(c) => onStateChange(particle, c)}
            particle={particle}
            choices={particleChoices}
            selected={selected[particle]}
          />
        );
      })}
    </ul>
  );
};

/**
 * To pass selected state in a URL search parameter it has to be made URL friendly using this method.
 */
export function stateSelectionToSearchParam(selection: StateSelected) {
  return btoa(JSON.stringify(selection));
}

/**
 * To understand the selected state in a URL search parameter it has parsed using this method.
 */
export function stateSelectionFromSearchParam(
  parameter: string
): StateSelected {
  return JSON.parse(atob(parameter));
}
