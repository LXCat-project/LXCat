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
import { arrayEquality } from "./utils";

interface StateSelectUpdate {
  kind: "state";
  side: "lhs" | "rhs";
  index: number;
  value?: StatePath;
}

interface TypeTagUpdate {
  kind: "type_tag";
  value: Array<ReactionTypeTag>;
}

interface ReversibleUpdate {
  kind: "reversible";
  value: Reversible;
}

interface CSSetUpdate {
  kind: "cs_set";
  selected: Set<string>;
}

type UpdateType =
  | CSSetUpdate
  | StateSelectUpdate
  | TypeTagUpdate
  | ReversibleUpdate;

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
  choices: ReactionChoices;
  selection: ReactionOptions;
  editable: boolean;
  onConsumesChange(newSelected: Array<StatePath>): void | Promise<void>;
  onConsumesAppend(choices: StateTree): void | Promise<void>;
  onConsumesRemove(index: number): void | Promise<void>;
  onProducesChange(newSelected: Array<StatePath>): void | Promise<void>;
  onProducesAppend(choices: StateTree): void | Promise<void>;
  onProducesRemove(index: number): void | Promise<void>;
  onTagsChange(newSelected: Array<ReactionTypeTag>): void | Promise<void>;
  onReversibleChange(newSelected: Reversible): void | Promise<void>;
  onCSSetsChange(newSelected: Set<string>): void | Promise<void>;
  onChange(newChoices: ReactionChoices): void | Promise<void>;
};

// TODO: Make new component that accepts selection and possibly choices for each
// subcomponent. If choices are omitted, fetch them based on the selection.
//  -> This requires Nextjs 13 and the React 18 (use + fetch) to do properly.

export const StatefulReactionPicker = ({
  ids,
  choices,
  selection,
  editable,
  onChange,
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

  const update = async (type: UpdateType) => {
    const newLhsPaths = selection.consumes
      .map((selected, index) =>
        type.kind === "state" && type.side === "lhs" && type.index === index
          ? type.value
          : selected
      )
      .filter((path): path is StatePath => path !== undefined);
    const newLhsSelected = getStateLeafs(newLhsPaths);

    const newRhsPaths = selection.produces.map((selected, index) =>
      type.kind === "state" && type.side === "rhs" && type.index === index
        ? type.value ?? {}
        : selected
    );
    const newRhsSelected = getStateLeafs(newRhsPaths);

    const newSelectedReversible =
      type.kind === "reversible" ? type.value : selection.reversible;
    const newSelectedTags =
      type.kind === "type_tag" ? type.value : selection.type_tags;
    const newSelectedCSSets =
      type.kind === "cs_set" ? type.selected : new Set(selection.set);

    if (type.kind === "type_tag") {
      onTagsChange(newSelectedTags);
    } else if (type.kind === "reversible") {
      onReversibleChange(newSelectedReversible);
    } else if (type.kind === "state") {
      type.side === "lhs"
        ? type.value
          ? onConsumesChange(newLhsPaths)
          : onConsumesRemove(type.index)
        : type.value
        ? onProducesChange(newRhsPaths)
        : onProducesRemove(type.index);
    } else if (type.kind === "cs_set") {
      onCSSetsChange(newSelectedCSSets);
    }

    const consumesChoices =
      type.kind === "state" && type.side === "lhs" && !type.value
        ? choices.consumes.filter((_, i) => i !== type.index)
        : choices.consumes;
    const producesChoices =
      type.kind === "state" && type.side === "rhs" && !type.value
        ? choices.produces.filter((_, i) => i !== type.index)
        : choices.produces;

    const consumesIds =
      type.kind === "state" && type.side === "lhs" && !type.value
        ? ids.consumes.filter((_, i) => i !== type.index)
        : ids.consumes;
    const producesIds =
      type.kind === "state" && type.side === "rhs" && !type.value
        ? ids.produces.filter((_, i) => i !== type.index)
        : ids.produces;

    Promise.all([
      Promise.all(
        consumesChoices.map(async (data, index) => {
          if (
            type.kind === "state" &&
            type.side === "lhs" &&
            type.index === index &&
            type.value
          ) {
            return { id: consumesIds[index], data, selected: type.value };
          }

          const consumed = newLhsPaths
            .filter(
              (path, i): path is StatePath =>
                i !== index && path.particle !== undefined
            )
            .map(getStateLeaf) as Array<StateLeaf>;
          const produced = newRhsSelected;

          const tree = await fetchStateTreeForSelection(
            StateProcess.Consumed,
            consumed,
            produced,
            newSelectedTags,
            newSelectedReversible,
            newSelectedCSSets
          );

          return {
            id: consumesIds[index],
            data: tree,
            selected: newLhsPaths[index],
          };
        })
      ).then((newConsumes) =>
        newConsumes.filter(
          (
            state
          ): state is { id: string; data: StateTree; selected: StatePath } =>
            state !== undefined
        )
      ),
      Promise.all(
        producesChoices.map(async (data, index) => {
          if (
            type.kind === "state" &&
            type.side === "rhs" &&
            type.index === index &&
            type.value
          ) {
            return { id: producesIds[index], data, selected: type.value };
          }

          // Get selected states based on other boxes.
          const consumed = newLhsSelected;
          const produced = newRhsPaths
            .filter(
              (path, i): path is StatePath =>
                i !== index && path.particle !== undefined
            )
            .map(getStateLeaf) as Array<StateLeaf>;

          const tree = await fetchStateTreeForSelection(
            StateProcess.Produced,
            consumed,
            produced,
            newSelectedTags,
            newSelectedReversible,
            newSelectedCSSets
          );

          return {
            id: producesIds[index],
            data: tree,
            selected: newRhsPaths[index],
          };
        })
      ).then((newProduces) =>
        newProduces.filter(
          (
            state
          ): state is { id: string; data: StateTree; selected: StatePath } =>
            state !== undefined
        )
      ),
      type.kind !== "type_tag"
        ? fetchTypeTags(
            newLhsSelected,
            newRhsSelected,
            newSelectedReversible,
            newSelectedCSSets
          ).then(async (newTags) => {
            const filteredTags = newSelectedTags.filter((tag) =>
              newTags.includes(tag)
            );
            onTagsChange(filteredTags);
            return [newTags, filteredTags];
          })
        : [choices.typeTags, newSelectedTags],
      type.kind !== "reversible"
        ? fetchReversible(
            newLhsSelected,
            newRhsSelected,
            newSelectedTags,
            newSelectedCSSets
          ).then((newReversible): [Array<Reversible>, Reversible] => [
            newReversible,
            newSelectedReversible,
          ])
        : ([choices.reversible, newSelectedReversible] as [
            Array<Reversible>,
            Reversible
          ]),
      type.kind !== "cs_set"
        ? fetchCSSets(
            newLhsSelected,
            newRhsSelected,
            newSelectedTags,
            newSelectedReversible
          ).then((newCSSets): [CSSetTree, Set<string>] => {
            const sets = Object.values(newCSSets).flatMap((set) =>
              Object.keys(set.sets)
            );
            const filteredSelectedSets = new Set(
              [...newSelectedCSSets].filter((set) => sets.includes(set))
            );
            const filteredUnfoldedOrgs = new Set(
              [...unfoldedOrgs].filter((orgId) => orgId in newCSSets)
            );
            onCSSetsChange(filteredSelectedSets);
            setUnfoldedOrgs(filteredUnfoldedOrgs);
            return [newCSSets, filteredSelectedSets];
          })
        : ([choices.set, newSelectedCSSets] as [CSSetTree, Set<string>]),
    ]).then(
      async ([
        consumes,
        produces,
        [typeTags, newSelectedTags],
        [reversible, newSelectedReversible],
        [csSets, newSelectedCSSets],
      ]) => {
        const newChoices = {
          consumes: consumes.map((props) => props.data),
          produces: produces.map((props) => props.data),
          typeTags,
          reversible,
          set: csSets,
        };
        onChange(newChoices);
        if (
          (type.kind !== "type_tag" &&
            !arrayEquality(newSelectedTags, selection.type_tags)) ||
          // FIXME: This is inefficient (only one set needs to be converted to
          // an array).
          (type.kind !== "cs_set" &&
            !arrayEquality([...newSelectedCSSets], [...selection.set]))
        ) {
          if (type.kind === "state") {
            if (type.side === "lhs" && type.value) {
              fetchStateTreeForSelection(
                StateProcess.Consumed,
                newLhsSelected.filter((_, i) => i !== type.index),
                newRhsSelected,
                newSelectedTags,
                newSelectedReversible,
                newSelectedCSSets
              ).then((tree) =>
                onChange({
                  ...newChoices,
                  consumes: newChoices.consumes.map((data, i) =>
                    type.index === i ? tree : data
                  ),
                })
              );
            } else {
              fetchStateTreeForSelection(
                StateProcess.Produced,
                newLhsSelected,
                newRhsSelected.filter((_, i) => i !== type.index),
                newSelectedTags,
                newSelectedReversible,
                newSelectedCSSets
              ).then((tree) =>
                onChange({
                  ...newChoices,
                  produces: newChoices.produces.map((data, i) =>
                    type.index === i ? tree : data
                  ),
                })
              );
            }
          } else if (type.kind === "type_tag") {
            fetchTypeTags(
              newLhsSelected,
              newRhsSelected,
              newSelectedReversible,
              newSelectedCSSets
            ).then((typeTags) => onChange({ ...newChoices, typeTags }));
          } else if (type.kind === "reversible") {
            fetchReversible(
              newLhsSelected,
              newRhsSelected,
              newSelectedTags,
              newSelectedCSSets
            ).then((reversible) => onChange({ ...newChoices, reversible }));
          } else if (type.kind === "cs_set") {
            fetchCSSets(
              newLhsSelected,
              newRhsSelected,
              newSelectedTags,
              newSelectedReversible
            ).then((csSets) => onChange({ ...newChoices, set: csSets }));
          }
        }
      }
    );
  };

  const initTree = async (side: "lhs" | "rhs") =>
    fetchStateTreeForSelection(
      side === "lhs" ? StateProcess.Consumed : StateProcess.Produced,
      selection.consumes
        .map(getStateLeaf)
        .filter((selected): selected is StateLeaf => selected !== undefined),
      selection.produces
        .map(getStateLeaf)
        .filter((selected): selected is StateLeaf => selected !== undefined),
      selection.type_tags,
      selection.reversible,
      new Set(selection.set)
    );

  return editable ? (
    <ReactionPicker
      consumes={{
        entries: ids.consumes.map((id, index) => ({
          id,
          data: choices.consumes[index],
          selected: selection.consumes[index],
        })),
        onAppend: async () => {
          const tree = await initTree("lhs");
          return onConsumesAppend(tree);
        },
        onRemove: async (index) => {
          await update({ kind: "state", side: "lhs", index });
        },
        onUpdate: async (index, selected) =>
          update({ kind: "state", side: "lhs", index, value: selected }),
      }}
      produces={{
        entries: ids.produces.map((id, index) => ({
          id,
          data: choices.produces[index],
          selected: selection.produces[index],
        })),
        onAppend: async () => {
          const tree = await initTree("rhs");
          return onProducesAppend(tree);
        },
        onRemove: async (index) =>
          update({ kind: "state", side: "rhs", index }),
        onUpdate: async (index, selected) =>
          update({ kind: "state", side: "rhs", index, value: selected }),
      }}
      reversible={{
        onChange: (value) =>
          update({ kind: "reversible", value: value as Reversible }),
        choices: choices.reversible,
        value: selection.reversible,
      }}
      typeTags={{
        data: choices.typeTags,
        value: selection.type_tags,
        onChange: (newTags: Array<ReactionTypeTag>) =>
          update({ kind: "type_tag", value: newTags }),
      }}
      sets={{
        data: choices.set,
        selection: new Set(selection.set),
        unfolded: unfoldedOrgs,
        onSetChecked(setId, checked) {
          const newSelectedCSSets = new Set(selection.set);

          checked
            ? newSelectedCSSets.add(setId)
            : newSelectedCSSets.delete(setId);

          update({ kind: "cs_set", selected: newSelectedCSSets });
        },
        onOrganizationChecked(id, checked) {
          const newSelectedCSSets = new Set(selection.set);

          Object.keys(choices.set[id].sets).forEach((setId) => {
            checked
              ? newSelectedCSSets.add(setId)
              : newSelectedCSSets.delete(setId);
          });

          update({ kind: "cs_set", selected: newSelectedCSSets });
        },
        onOrganizationUnfolded(id, unfolded) {
          const newUnfolded = new Set(unfoldedOrgs);
          unfolded ? newUnfolded.add(id) : newUnfolded.delete(id);

          setUnfoldedOrgs(newUnfolded);
        },
      }}
    />
  ) : (
    getLatexForReaction(choices, selection)
  );
};
