// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// @ts-nocheck
// TODO: Deprecate

import {
  ChargeChoices,
  ParticleChoices,
  StateChoices,
  VibrationalChoices,
} from "@lxcat/database/dist/shared/queries/state";
import { useEffect, useState } from "react";
import { Latex } from "./Latex";

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

const ulStyle = {
  marginBlockStart: 0,
  marginBlockEnd: 0,
  listStyleType: "none",
  paddingInlineStart: "1.5rem",
};

const VibrationalFilter = ({
  label,
  selected,
  choices,
  onChange,
}: {
  label: string;
  selected: { rotational: string[] };
  choices: { rotational: string[] };
  onChange: (newSelection: { rotational: string[] } | undefined) => void;
}) => {
  const checked = selected !== undefined;
  const hasRotationalChoices = Object.keys(choices.rotational).length > 0;

  function onCheckboxChange() {
    if (checked) {
      onChange(undefined);
    } else {
      onChange({ rotational: [] });
    }
  }

  function onRotationalChange(rotationalSummary: string) {
    if (selected.rotational.includes(rotationalSummary)) {
      const index = selected.rotational.indexOf(rotationalSummary);
      const newSelection = [...selected.rotational];
      newSelection.splice(index, 1);
      onChange({ rotational: newSelection });
    } else {
      const newSelection = [...selected.rotational, rotationalSummary];
      onChange({ rotational: newSelection });
    }
  }

  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} onChange={onCheckboxChange} />
        {label}
      </label>
      {checked && hasRotationalChoices
        ? (
          <ul style={ulStyle}>
            <li>Rotational</li>
            {choices.rotational.map((rotationalSummary) => (
              <label key={`${label}-${rotationalSummary}`}>
                <input
                  type="checkbox"
                  checked={selected.rotational.includes(rotationalSummary)}
                  onChange={() =>
                    onRotationalChange(rotationalSummary)}
                />
                {rotationalSummary}
              </label>
            ))}
          </ul>
        )
        : <></>}
    </li>
  );
};

const ElectronicFilter = ({
  label,
  selected,
  choices,
  onChange,
}: {
  label: string;
  selected: { vibrational: VibrationalChoices };
  choices: { vibrational: VibrationalChoices };
  onChange: (
    newSelection: { vibrational: VibrationalChoices } | undefined,
  ) => void;
}) => {
  const checked = selected !== undefined;
  const hasVibrationalChoices = Object.keys(choices.vibrational).length > 0;

  function onCheckboxChange() {
    if (checked) {
      onChange(undefined);
    } else {
      onChange({ vibrational: {} });
    }
  }

  function onVibrationalChange(
    vibrationalSummary: string,
    newVibratonalSelection: { rotational: string[] } | undefined,
  ) {
    if (vibrationalSummary in selected.vibrational) {
      if (newVibratonalSelection === undefined) {
        const { [vibrationalSummary]: _vibrational2drop, ...newSelection } =
          selected.vibrational;
        onChange({ vibrational: newSelection });
      } else {
        const newSelection = { ...selected.vibrational };
        newSelection[vibrationalSummary] = {
          ...selected.vibrational[vibrationalSummary],
          ...newVibratonalSelection,
        };
        onChange({ vibrational: newSelection });
      }
    } else {
      const newSelection = { ...selected.vibrational };
      newSelection[vibrationalSummary] = { rotational: [] };
      onChange({ vibrational: newSelection });
    }
  }

  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} onChange={onCheckboxChange} />
        <Latex>{label}</Latex>
      </label>
      {checked && hasVibrationalChoices
        ? (
          <ul style={ulStyle}>
            <li>Vibrational</li>
            {Object.entries(choices.vibrational).map(
              ([vibrationalSummary, vibrationalChoices]) => (
                <VibrationalFilter
                  key={`${label}-${vibrationalSummary}`}
                  label={vibrationalSummary}
                  selected={selected.vibrational[vibrationalSummary]}
                  choices={vibrationalChoices}
                  onChange={(n) => onVibrationalChange(vibrationalSummary, n)}
                />
              ),
            )}
          </ul>
        )
        : <></>}
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
    if (checked) {
      onChange(undefined);
    } else {
      onChange({ electronic: {} });
    }
  }

  function onElectonicChange(
    electronicSummary: string,
    newElectronicSelection: { vibrational: VibrationalChoices } | undefined,
  ) {
    if (electronicSummary in selected.electronic) {
      if (newElectronicSelection === undefined) {
        const { [electronicSummary]: _electronic2drop, ...rest } =
          selected.electronic;
        onChange({ electronic: rest });
      } else {
        const newSelection = { ...selected.electronic };
        newSelection[electronicSummary] = {
          ...selected.electronic[electronicSummary],
          ...newElectronicSelection,
        };
        onChange({ electronic: newSelection });
      }
    } else {
      const newSelection = { ...selected.electronic };
      newSelection[electronicSummary] = { vibrational: {} };
      onChange({ electronic: newSelection });
    }
  }

  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} onChange={onCheckboxChange} />
        {label}
      </label>
      {checked && hasElectronicChoices
        ? (
          <ul style={ulStyle}>
            <li>Electronic</li>
            {Object.entries(choices.electronic).map(
              ([electronicSummary, electronicChoices]) => (
                <ElectronicFilter
                  key={`${label}-${electronicSummary}`}
                  label={electronicSummary}
                  selected={selected.electronic[electronicSummary]}
                  choices={electronicChoices}
                  onChange={(n) => onElectonicChange(electronicSummary, n)}
                />
              ),
            )}
          </ul>
        )
        : <></>}
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

  function onChargeChange(
    charge: string,
    newChargeSelection: ChargeChoices | undefined,
  ) {
    const iCharge = parseInt(charge);

    if (iCharge in selected.charge) {
      if (newChargeSelection === undefined) {
        const { [parseInt(charge)]: _charge2drop, ...rest } = selected.charge;
        onChange({ charge: rest });
      } else {
        const newSelection = { ...selected.charge };
        newSelection[iCharge] = {
          ...selected.charge[iCharge],
          ...newChargeSelection,
        };
        onChange({ charge: newSelection });
      }
    } else {
      const newSelection = { ...selected.charge };
      newSelection[iCharge] = { electronic: {} };
      onChange({ charge: newSelection });
    }
  }
  // TODO render positive charge with + character
  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} onChange={onCheckboxChange} />
        {label}
      </label>
      {checked && hasChargeChoices
        ? (
          <ul style={ulStyle}>
            <li>Charge</li>
            {Object.entries(choices.charge).map(
              ([chargeValue, chargeChoices]) => (
                <ChargeFilter
                  key={`${label}-${chargeValue}`}
                  label={chargeValue}
                  selected={selected.charge[parseInt(chargeValue)]}
                  choices={chargeChoices}
                  onChange={(n) => onChargeChange(chargeValue, n)}
                />
              ),
            )}
          </ul>
        )
        : <></>}
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
  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected]);

  function onParticleChange(
    name: string,
    newParticleSelection: ParticleChoices | undefined,
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
    <ul style={{ ...ulStyle, paddingInlineStart: 0 }}>
      {Object.entries(choices.particle).map(([particleName, chargeChoices]) => (
        <ParticleFilter
          key={particleName}
          label={particleName}
          selected={selected.particle[particleName]}
          choices={chargeChoices}
          onChange={(n) => onParticleChange(particleName, n)}
        />
      ))}
    </ul>
  );
};
