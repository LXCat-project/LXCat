// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  ReactionOptions,
  ReactionTemplate,
  Reversible,
} from "@lxcat/database/item/picker";
import { StatePath } from "@lxcat/database/shared";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { JSX, useState } from "react";
import { ReactionPickerShell } from "./reaction-picker-shell";

export interface StateSelectIds {
  consumes: Array<string>;
  produces: Array<string>;
}

/** `options` are what the server computed to be selectable for `selection`. */
export type ReactionPickerProps = {
  ids: StateSelectIds;
  selection: ReactionTemplate;
  options: ReactionOptions;
  editable: boolean;
  latex: JSX.Element;
  onConsumesChange(
    index: number,
    newSelected: StatePath,
    newLatex: string,
  ): void | Promise<void>;
  onConsumesAppend(): void | Promise<void>;
  onConsumesRemove(index: number): void | Promise<void>;
  onProducesChange(
    index: number,
    newSelected: StatePath,
    newLatex: string,
  ): void | Promise<void>;
  onProducesAppend(): void | Promise<void>;
  onProducesRemove(index: number): void | Promise<void>;
  onTagsChange(newSelected: Array<ReactionTypeTag>): void | Promise<void>;
  onReversibleChange(newSelected: Reversible): void | Promise<void>;
  onCSSetsChange(newSelected: Set<string>): void | Promise<void>;
};

export const ReactionPicker = ({
  ids,
  selection,
  options,
  editable,
  latex,
  onConsumesChange,
  onConsumesAppend,
  onConsumesRemove,
  onProducesChange,
  onProducesAppend,
  onProducesRemove,
  onTagsChange,
  onCSSetsChange,
  onReversibleChange,
}: ReactionPickerProps) => {
  const [unfoldedOrgs, setUnfoldedOrgs] = useState<Set<string>>(new Set());
  return editable
    ? (
      <ReactionPickerShell
        consumes={{
          entries: ids.consumes.map((id, index) => ({
            id,
            selected: selection.consumes[index],
            tree: options.consumes[index],
          })),
          onAppend: onConsumesAppend,
          onRemove: onConsumesRemove,
          onUpdate: onConsumesChange,
        }}
        produces={{
          entries: ids.produces.map((id, index) => ({
            id,
            selected: selection.produces[index],
            tree: options.produces[index],
          })),
          onAppend: onProducesAppend,
          onRemove: onProducesRemove,
          onUpdate: onProducesChange,
        }}
        reversible={{
          onChange: (value) => onReversibleChange(value as Reversible),
          choices: options.reversible,
          value: selection.reversible,
        }}
        typeTags={{
          data: options.typeTags,
          value: selection.typeTags,
          onChange: (newTags: Array<string>) =>
            onTagsChange(newTags as Array<ReactionTypeTag>),
        }}
        sets={{
          data: options.set,
          selection: new Set(selection.set),
          unfolded: unfoldedOrgs,
          onSetChecked(setId, checked) {
            const newSelectedCSSets = new Set(
              selection.set.filter((set) =>
                Object.values(options.set).some((summ) => set in summ.sets)
              ),
            );

            checked
              ? newSelectedCSSets.add(setId)
              : newSelectedCSSets.delete(setId);

            onCSSetsChange(newSelectedCSSets);
          },
          onOrganizationChecked(id, checked) {
            const newSelectedCSSets = new Set(
              selection.set.filter((set) =>
                Object.values(options.set).some((summ) => set in summ.sets)
              ),
            );

            Object.keys(options.set[id].sets).forEach((setId) => {
              checked
                ? newSelectedCSSets.add(setId)
                : newSelectedCSSets.delete(setId);
            });

            onCSSetsChange(newSelectedCSSets);
          },
          onOrganizationUnfolded(id, unfolded) {
            const newUnfolded = new Set(unfoldedOrgs);
            unfolded ? newUnfolded.add(id) : newUnfolded.delete(id);

            setUnfoldedOrgs(newUnfolded);
          },
        }}
      />
    )
    : latex;
};
