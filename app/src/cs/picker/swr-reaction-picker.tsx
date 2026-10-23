// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  CSSetTree,
  ReactionTemplate,
  Reversible,
  StateProcess,
} from "@lxcat/database/item/picker";
import { getStateLeafs, StatePath } from "@lxcat/database/shared";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { JSX, useState } from "react";
import {
  getCSSetsAction,
  getReversibleAction,
  getTypeTagsAction,
} from "./actions";
import { SWRReactionPickerShell } from "./swr-reaction-picker-shell";

import { omit } from "@/shared/utils";
import useSWRImmutable from "swr/immutable";

export interface StateSelectIds {
  consumes: Array<string>;
  produces: Array<string>;
}

export type SWRReactionPickerProps = {
  ids: StateSelectIds;
  selection: ReactionTemplate;
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

const typeTagFetcher = async ({
  consumes,
  produces,
  reversible,
  set,
}: Omit<ReactionTemplate, "typeTags">): Promise<Array<ReactionTypeTag>> =>
  getTypeTagsAction({
    consumes: getStateLeafs(consumes),
    produces: getStateLeafs(produces),
    reversible,
    setIds: set,
  });

const reversibleFetcher = async ({
  consumes,
  produces,
  typeTags,
  set,
}: Omit<ReactionTemplate, "reversible">): Promise<Array<Reversible>> =>
  getReversibleAction({
    consumes: getStateLeafs(consumes),
    produces: getStateLeafs(produces),
    typeTags,
    setIds: set,
  });

const csSetsFetcher = async ({
  consumes,
  produces,
  reversible,
  typeTags,
}: Omit<ReactionTemplate, "set">): Promise<CSSetTree> =>
  getCSSetsAction({
    consumes: getStateLeafs(consumes),
    produces: getStateLeafs(produces),
    typeTags,
    reversible,
  });

export const SWRReactionPicker = ({
  ids,
  selection,
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
}: SWRReactionPickerProps) => {
  const [unfoldedOrgs, setUnfoldedOrgs] = useState<Set<string>>(new Set());
  const { data: typeTags, error: tagError } = useSWRImmutable(
    omit(selection, "typeTags"),
    typeTagFetcher,
    { keepPreviousData: true },
  );
  const { data: reversible, error: reversibleError } = useSWRImmutable(
    omit(selection, "reversible"),
    reversibleFetcher,
    { keepPreviousData: true },
  );
  const { data: csSets, error: csSetsError } = useSWRImmutable(
    omit(selection, "set"),
    csSetsFetcher,
    { keepPreviousData: true },
  );

  // NOTE: Technically this should never equate to true, as `keepPreviousData`
  // is true and the initial state is prefetched and added to the cache.
  if (!(typeTags && reversible && csSets)) {
    return (
      <div>
        {JSON.stringify(
          {
            reversible: reversibleError,
            typeTags: tagError,
            csSets: csSetsError,
          },
          null,
          2,
        )}
      </div>
    );
  }

  return editable
    ? (
      <SWRReactionPickerShell
        consumes={{
          entries: ids.consumes.map((id, index) => ({
            id,
            selected: selection.consumes[index],
            selection: {
              consumes: getStateLeafs(
                selection.consumes.filter((_, j) => j !== index),
              ),
              produces: getStateLeafs(selection.produces),
              typeTags: selection.typeTags,
              reversible: selection.reversible,
              csSets: new Set(selection.set),
            },
          })),
          process: StateProcess.Consumed,
          onAppend: onConsumesAppend,
          onRemove: onConsumesRemove,
          onUpdate: onConsumesChange,
        }}
        produces={{
          entries: ids.produces.map((id, index) => ({
            id,
            selected: selection.produces[index],
            selection: {
              consumes: getStateLeafs(selection.consumes),
              produces: getStateLeafs(
                selection.produces.filter((_, j) => j !== index),
              ),
              typeTags: selection.typeTags,
              reversible: selection.reversible,
              csSets: new Set(selection.set),
            },
          })),
          process: StateProcess.Produced,
          onAppend: onProducesAppend,
          onRemove: onProducesRemove,
          onUpdate: onProducesChange,
        }}
        reversible={{
          onChange: (value) => onReversibleChange(value as Reversible),
          choices: reversible,
          value: selection.reversible,
        }}
        typeTags={{
          data: typeTags,
          value: selection.typeTags,
          onChange: (newTags: Array<string>) =>
            onTagsChange(newTags as Array<ReactionTypeTag>),
        }}
        sets={{
          data: csSets,
          selection: new Set(selection.set),
          unfolded: unfoldedOrgs,
          onSetChecked(setId, checked) {
            const newSelectedCSSets = new Set(
              selection.set.filter((set) =>
                Object.values(csSets).some((summ) => set in summ.sets)
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
                Object.values(csSets).some((summ) => set in summ.sets)
              ),
            );

            Object.keys(csSets[id].sets).forEach((setId) => {
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
