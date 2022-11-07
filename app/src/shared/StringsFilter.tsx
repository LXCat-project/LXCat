// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

interface Props {
  choices: string[];
  selection: string[];
  onChange: (selection: string[]) => void;
}

export const StringsFilter = ({ choices, selection, onChange }: Props) => {
  function onLocalChange(name: string, toggle: boolean) {
    let newSelection: string[];
    if (toggle) {
      newSelection = selection.filter((s) => s !== name);
    } else {
      newSelection = [...selection, name];
    }
    onChange(newSelection);
  }

  return (
    <div>
      {choices.map((d) => {
        const checked = selection.includes(d);
        return (
          <div key={d}>
            <label>
              <input
                type="checkbox"
                onChange={() => onLocalChange(d, checked)}
                checked={checked}
              />
              {d}
            </label>
          </div>
        );
      })}
    </div>
  );
};
