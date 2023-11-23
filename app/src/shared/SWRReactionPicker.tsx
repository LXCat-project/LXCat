// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  CSSetTree,
  ReactionTemplate,
  Reversible,
  StateProcess,
} from "@lxcat/database/item/picker";
import { getStateLeafs, StateLeaf, StatePath } from "@lxcat/database/shared";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { useState } from "react";
import { SWRReactionPickerImpl } from "./SWRReactionPickerImpl";

import useSWRImmutable from "swr/immutable";
import { omit } from "./utils";

export const fetchTypeTags = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  reversible: Reversible,
  setIds: Set<string>,
): Promise<Array<ReactionTypeTag>> =>
  (
    await fetch(
      `/api/reactions/type_tags?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        reversible,
        setIds: JSON.stringify([...setIds]),
      })}`,
    )
  ).json();
export const fetchReversible = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  setIds: Set<string>,
): Promise<Array<Reversible>> =>
  (
    await fetch(
      `/api/reactions/reversible?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        setIds: JSON.stringify([...setIds]),
      })}`,
    )
  ).json();
export const fetchCSSets = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
): Promise<CSSetTree> =>
  (
    await fetch(
      `/api/reactions/cs-set?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        reversible,
      })}`,
    )
  ).json();

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
}: Omit<ReactionTemplate, "typeTags">) =>
  fetchTypeTags(
    getStateLeafs(consumes),
    getStateLeafs(produces),
    reversible,
    new Set(set),
  );

const reversibleFetcher = async ({
  consumes,
  produces,
  typeTags,
  set,
}: Omit<ReactionTemplate, "reversible">) =>
  fetchReversible(
    getStateLeafs(consumes),
    getStateLeafs(produces),
    typeTags,
    new Set(set),
  );

const csSetsFetcher = async ({
  consumes,
  produces,
  reversible,
  typeTags,
}: Omit<ReactionTemplate, "set">) =>
  fetchCSSets(
    getStateLeafs(consumes),
    getStateLeafs(produces),
    typeTags,
    reversible,
  );

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
      <SWRReactionPickerImpl
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
            const newSelectedCSSets = new Set(selection.set);

            checked
              ? newSelectedCSSets.add(setId)
              : newSelectedCSSets.delete(setId);

            onCSSetsChange(newSelectedCSSets);
          },
          onOrganizationChecked(id, checked) {
            const newSelectedCSSets = new Set(selection.set);

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
    : (
      latex
    );
};
