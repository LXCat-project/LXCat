// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  CSSetTree,
  ReactionChoices,
  ReactionOptions,
  Reversible,
  StateProcess,
} from "@lxcat/database/dist/cs/queries/public";
import {
  getStateLeaf,
  StateLeaf,
  StatePath,
} from "@lxcat/database/dist/shared/getStateLeaf";
import { StateTree } from "@lxcat/database/dist/shared/queries/state";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { Group } from "@mantine/core";
import { useState } from "react";
import { Latex } from "./Latex";
import { SWRReactionPickerImpl } from "./SWRReactionPickerImpl";

import useSWRImmutable from "swr/immutable";

const getStateLeafs = (entries: Array<StatePath>): Array<StateLeaf> =>
  entries.map(getStateLeaf).filter((id): id is StateLeaf => id !== undefined);

export const fetchStateTreeForSelection = async (
  stateProcess: StateProcess,
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
  setIds: Set<string>
): Promise<StateTree> =>
  (
    await fetch(
      `/api/states/partaking?${new URLSearchParams({
        stateProcess: stateProcess,
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        reversible,
        setIds: JSON.stringify([...setIds]),
      })}`
    )
  ).json();
export const fetchTypeTags = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  reversible: Reversible,
  setIds: Set<string>
): Promise<Array<ReactionTypeTag>> =>
  (
    await fetch(
      `/api/reactions/type_tags?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        reversible,
        setIds: JSON.stringify([...setIds]),
      })}`
    )
  ).json();
export const fetchReversible = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  setIds: Set<string>
): Promise<Array<Reversible>> =>
  (
    await fetch(
      `/api/reactions/reversible?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        setIds: JSON.stringify([...setIds]),
      })}`
    )
  ).json();
export const fetchCSSets = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible
): Promise<CSSetTree> =>
  (
    await fetch(
      `/api/reactions/cs-set?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        reversible,
      })}`
    )
  ).json();

const getLatexFromTree = (tree: StateTree, path: StatePath) => {
  let latex = "";

  if (path.particle) {
    let particle = tree[path.particle];
    latex += particle.latex;
    if (particle.children && path.electronic) {
      let electronic = particle.children[path.electronic];
      latex += `\\left(${electronic.latex}`;
      if (electronic.children && path.vibrational) {
        const vibrational = electronic.children[path.vibrational];
        latex += `\\left(v=${vibrational.latex}`;
        if (vibrational.children && path.rotational) {
          latex += `\\left(J=${
            vibrational.children[path.rotational].latex
          }\\right)`;
        }
        latex += "\\right)";
      }
      latex += "\\right)";
    }
  }

  return latex;
};


export interface StateSelectIds {
  consumes: Array<string>;
  produces: Array<string>;
}

export type StatefulReactionPickerProps = {
  ids: StateSelectIds;
  selection: ReactionOptions;
  editable: boolean;
  latex: JSX.Element;
  onConsumesChange(
    index: number,
    newSelected: StatePath,
    newLatex: string
  ): void | Promise<void>;
  onConsumesAppend(): void | Promise<void>;
  onConsumesRemove(index: number): void | Promise<void>;
  onProducesChange(
    index: number,
    newSelected: StatePath,
    newLatex: string
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
}: Omit<ReactionOptions, "typeTags">) =>
  fetchTypeTags(
    getStateLeafs(consumes),
    getStateLeafs(produces),
    reversible,
    new Set(set)
  );

const reversibleFetcher = async ({
  consumes,
  produces,
  type_tags,
  set,
}: Omit<ReactionOptions, "reversible">) =>
  fetchReversible(
    getStateLeafs(consumes),
    getStateLeafs(produces),
    type_tags,
    new Set(set)
  );

const csSetsFetcher = async ({
  consumes,
  produces,
  reversible,
  type_tags,
}: Omit<ReactionOptions, "set">) =>
  fetchCSSets(
    getStateLeafs(consumes),
    getStateLeafs(produces),
    type_tags,
    reversible
  );

function omit<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const _ = { ...obj };
  keys.forEach((key) => delete _[key]);
  return _;
}

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
}: StatefulReactionPickerProps) => {
  const [unfoldedOrgs, setUnfoldedOrgs] = useState<Set<string>>(new Set());
  const { data: typeTags, error: tagError } = useSWRImmutable(
    omit(selection, "type_tags"),
    typeTagFetcher,
    { keepPreviousData: true }
  );
  const { data: reversible, error: reversibleError } = useSWRImmutable(
    omit(selection, "reversible"),
    reversibleFetcher,
    { keepPreviousData: true }
  );
  const { data: csSets, error: csSetsError } = useSWRImmutable(
    omit(selection, "set"),
    csSetsFetcher,
    { keepPreviousData: true }
  );

  if (!(typeTags && reversible && csSets)) {
    // console.log(JSON.stringify({ reversible, typeTags, csSets }, null, 2));
    return (
      <div>
        {JSON.stringify(
          {
            reversible: reversibleError,
            typeTags: tagError,
            csSets: csSetsError,
          },
          null,
          2
        )}
      </div>
    );
  }

  return editable ? (
    <SWRReactionPickerImpl
      consumes={{
        entries: ids.consumes.map((id, index) => ({
          id,
          selected: selection.consumes[index],
          selection: {
            consumes: getStateLeafs(
              selection.consumes.filter((_, j) => j !== index)
            ),
            produces: getStateLeafs(selection.produces),
            typeTags: selection.type_tags,
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
              selection.produces.filter((_, j) => j !== index)
            ),
            typeTags: selection.type_tags,
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
        value: selection.type_tags,
        onChange: (newTags: Array<ReactionTypeTag>) => onTagsChange(newTags),
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
  ) : (
    latex
  );
};
