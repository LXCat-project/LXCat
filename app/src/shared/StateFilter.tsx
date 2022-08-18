import {
  ChargeChoices,
  ParticleChoices,
  StateChoices,
  VibrationalChoices,
} from "@lxcat/database/dist/shared/queries/state";
import { useState } from "react";

/**
 * To pass selected state in a URL search parameter it has to be made URL friendly using this method.
 */
export function stateSelectionToSearchParam(selection: StateChoices) {
  return btoa(JSON.stringify(selection));
}

/**
 * To understand the selected state in a URL search parameter it has parsed using this method.
 */
export function stateSelectionFromSearchParam(parameter: string): StateChoices {
  return JSON.parse(atob(parameter));
}

const VibrationalFilter = ({
  label,
  selected,
  choices,
}: {
  label: string;
  selected: { rotational: string[] };
  choices: { rotational: string[] };
}) => {
  const checked = selected !== undefined;
  const hasRotationalChoices = Object.keys(choices.rotational).length > 0;
  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} />
        {label}
      </label>
      {checked && hasRotationalChoices ? (
        <div>
          <span>Rotational</span>
          <ul>
            {choices.rotational.map((rotationalSummary) => (
              <label key={`${label}-${rotationalSummary}`}>
                <input
                  type="checkbox"
                  checked={selected.rotational.includes(rotationalSummary)}
                />
                {rotationalSummary}
              </label>
            ))}
          </ul>
        </div>
      ) : (
        !hasRotationalChoices && <div>No rotational</div>
      )}
    </li>
  );
};

const ElectronicFilter = ({
  label,
  selected,
  choices,
}: {
  label: string;
  selected: { vibrational: VibrationalChoices };
  choices: { vibrational: VibrationalChoices };
}) => {
  const checked = selected !== undefined;
  const hasVibrationalChoices = Object.keys(choices.vibrational).length > 0;
  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} />
        {label}
      </label>
      {checked && hasVibrationalChoices ? (
        <div>
          <span>Vibrational</span>
          <ul>
            {Object.entries(choices.vibrational).map(
              ([vibrationalSummary, vibrationalChoices]) => (
                <VibrationalFilter
                  key={`${label}-${vibrationalSummary}`}
                  label={vibrationalSummary}
                  selected={selected.vibrational[vibrationalSummary]}
                  choices={vibrationalChoices}
                />
              )
            )}
          </ul>
        </div>
      ) : (
        !hasVibrationalChoices && <div>No vibrational</div>
      )}
    </li>
  );
};

const ChargeFilter = ({
  label,
  selected,
  choices,
  onChange,
}: {
  label: string;
  selected: ChargeChoices;
  choices: ChargeChoices;
  onChange: (newSelection: ChargeChoices | undefined) => void;
}) => {
  const checked = selected !== undefined;
  const hasElectronicChoices = Object.keys(choices.electronic).length > 0;

  function onCheckboxChange() {
    debugger;
    if (checked) {
      onChange(undefined);
    } else {
      onChange({ electronic: {} });
    }
  }
  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} onChange={onCheckboxChange} />
        {label}
      </label>
      {checked && hasElectronicChoices ? (
        <div>
          <span>Electronic</span>
          <ul>
            {Object.entries(choices.electronic).map(
              ([electronicSummary, electronicChoices]) => (
                <ElectronicFilter
                  key={`${label}-${electronicSummary}`}
                  label={electronicSummary}
                  selected={selected.electronic[electronicSummary]}
                  choices={electronicChoices}
                />
              )
            )}
          </ul>
        </div>
      ) : (
        !hasElectronicChoices && <div>No electronic</div>
      )}
    </li>
  );
};

const ParticleFilter = ({
  label,
  selected,
  choices,
  onChange,
}: {
  label: string;
  selected: ParticleChoices;
  choices: ParticleChoices;
  onChange: (newSelection: ParticleChoices | undefined) => void;
}) => {
  const checked = selected !== undefined;
  const hasChargeChoices = Object.keys(choices.charge).length > 0;

  function onCheckboxChange() {
    if (checked) {
      onChange(undefined);
    } else {
      onChange({ charge: {} });
    }
  }

  function onChargeChange(charge: string, newChargeSelection: ChargeChoices) {
    const iCharge = parseInt(charge);

    if (charge in selected.charge) {
      if (newChargeSelection === undefined) {
        const { [parseInt(charge)]: _charge2drop, ...rest } = selected.charge;
        const newSelected = { charge: rest };
        onChange({ charge: newSelected });
      } else {
        const newSelection = { ...selected.charge };
        newSelection[iCharge] = {
          ...selected.charge[iCharge],
          ...newChargeSelection,
        };
        onChange({ charge: newSelection });
      }
    }
  }
  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} onChange={onCheckboxChange} />
        {label}
      </label>
      {checked && hasChargeChoices ? (
        <div>
          <span>Charge</span>

          <ul>
            {Object.entries(choices.charge).map(
              ([chargeValue, chargeChoices]) => (
                <ChargeFilter
                  key={`${label}-${chargeValue}`}
                  label={chargeValue}
                  selected={selected.charge[parseInt(chargeValue)]}
                  choices={chargeChoices}
                  onChange={(n) => onChargeChange(chargeValue, n)}
                />
              )
            )}
          </ul>
        </div>
      ) : (
        !hasChargeChoices && <div>No charge</div>
      )}
    </li>
  );
};

export const StateFilter = ({
  choices,
  selected: initialSelected,
  onChange,
}: {
  choices: StateChoices;
  selected: StateChoices;
  onChange: (newSelection: StateChoices) => void;
}) => {
  const [selected, setSelected] = useState(initialSelected);

  function onParticleChange(
    name: string,
    newParticleSelection: ParticleChoices | undefined
  ) {
    let newSelected: StateChoices;
    if (newParticleSelection === undefined) {
      const { [name]: _particle2drop, ...inner } = selected.particle;
      newSelected = { particle: inner };
    } else {
      newSelected = { particle: { ...selected.particle } };
      newSelected.particle[name] = newParticleSelection;
    }
    setSelected(newSelected);
    onChange(newSelected);
  }

  return (
    <>
      <span>Particle</span>
      <ul>
        {Object.entries(choices.particle).map(
          ([particleName, chargeChoices]) => (
            <ParticleFilter
              key={particleName}
              label={particleName}
              selected={selected.particle[particleName]}
              choices={chargeChoices}
              onChange={(n) => onParticleChange(particleName, n)}
            />
          )
        )}
      </ul>
    </>
  );
};
