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
import { ReactionPicker } from "./ReactionPicker";

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
) =>
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
  ).json() as Promise<StateTree>;
export const fetchTypeTags = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  reversible: Reversible,
  setIds: Set<string>
) =>
  (
    await fetch(
      `/api/reactions/type_tags?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        reversible,
        setIds: JSON.stringify([...setIds]),
      })}`
    )
  ).json() as Promise<Array<ReactionTypeTag>>;
export const fetchReversible = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  setIds: Set<string>
) =>
  (
    await fetch(
      `/api/reactions/reversible?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        setIds: JSON.stringify([...setIds]),
      })}`
    )
  ).json() as Promise<Array<Reversible>>;
export const fetchCSSets = async (
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible
) =>
  (
    await fetch(
      `/api/reactions/cs-set?${new URLSearchParams({
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        reversible,
      })}`
    )
  ).json() as Promise<CSSetTree>;

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

const getLatexForReaction = (
  choices: ReactionChoices,
  options: ReactionOptions
) => {
  let lhs = options.consumes
    .map((path, j) => {
      const tree = choices.consumes[j];
      return getLatexFromTree(tree, path);
    })
    .join("+");
  if (lhs === "") {
    lhs = "*";
  }
  let rhs = options.produces
    .map((path, j) => {
      const tree = choices.produces[j];
      return getLatexFromTree(tree, path);
    })
    .join("+");
  if (rhs === "") {
    rhs = "*";
  }

  const arrow =
    options.reversible === Reversible.Both
      ? "\\rightarrow \\\\ \\leftrightarrow"
      : options.reversible === Reversible.False
      ? "\\rightarrow"
      : "\\leftrightarrow";

  return (
    <Group>
      <Latex>{lhs}</Latex>
      <Latex>{arrow}</Latex>
      <Latex>{rhs}</Latex>
    </Group>
  );
};

export interface StateSelectIds {
  consumes: Array<string>;
  produces: Array<string>;
}

export type StatefulReactionPickerProps = {
  ids: StateSelectIds;
  selection: ReactionOptions;
  editable: boolean;
  onConsumesChange(newSelected: Array<StatePath>): void | Promise<void>;
  onConsumesAppend(): void | Promise<void>;
  onConsumesRemove(index: number): void | Promise<void>;
  onProducesChange(newSelected: Array<StatePath>): void | Promise<void>;
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

const consumesFetcher = async ({
  consumes,
  produces,
  type_tags,
  reversible,
  set,
}: ReactionOptions) =>
  Promise.all(
    consumes.map(async (_, index) =>
      fetchStateTreeForSelection(
        StateProcess.Consumed,
        getStateLeafs(consumes.filter((_, j) => j !== index)),
        getStateLeafs(produces),
        type_tags,
        reversible,
        new Set(set)
      )
    )
  );

const producesFetcher = async ({
  consumes,
  produces,
  type_tags,
  reversible,
  set,
}: ReactionOptions) =>
  Promise.all(
    produces.map(async (_, index) =>
      fetchStateTreeForSelection(
        StateProcess.Produced,
        getStateLeafs(consumes),
        getStateLeafs(produces.filter((_, j) => j !== index)),
        type_tags,
        reversible,
        new Set(set)
      )
    )
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
    typeTagFetcher
  );
  const { data: reversible, error: reversibleError } = useSWRImmutable(
    omit(selection, "reversible"),
    reversibleFetcher
  );
  const { data: csSets, error: csSetsError } = useSWRImmutable(
    omit(selection, "set"),
    csSetsFetcher
  );
  const { data: consumes, error: consumeError } = useSWRImmutable(
    selection,
    consumesFetcher
  );
  const { data: produces, error: produceError } = useSWRImmutable(
    selection,
    producesFetcher
  );

  if (!(typeTags && consumes && produces && reversible && csSets)) {
    return (
      <div>
        {JSON.stringify(
          {
            consumes: consumeError,
            produces: produceError,
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
    <ReactionPicker
      consumes={{
        entries: ids.consumes.map((id, index) => ({
          id,
          data: consumes[index],
          selected: selection.consumes[index],
        })),
        onAppend: onConsumesAppend,
        onRemove: onConsumesRemove,
        onUpdate: async (index, selected) =>
          onConsumesChange(
            selection.consumes.map((value, j) =>
              index === j ? selected : value
            )
          ),
      }}
      produces={{
        entries: ids.produces.map((id, index) => ({
          id,
          data: produces[index],
          selected: selection.produces[index],
        })),
        onAppend: onProducesAppend,
        onRemove: onProducesRemove,
        onUpdate: async (index, selected) =>
          onProducesChange(
            selection.produces.map((value, j) =>
              index === j ? selected : value
            )
          ),
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
    getLatexForReaction(
      { consumes, produces, reversible, typeTags, set: csSets },
      selection
    )
  );
};
