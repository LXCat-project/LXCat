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
import { nanoid } from "nanoid";
import { useState } from "react";
import { Latex } from "./Latex";
import { ReactionPicker } from "./ReactionPicker";
import { arrayEquality } from "./utils";

interface StateEntryProps {
  data: StateTree;
  selected: StatePath;
}

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

const getSelectedStates = (entries: Array<StatePath>): Array<StateLeaf> =>
  entries
    .map((selected) => getStateLeaf(selected))
    .filter((id): id is StateLeaf => id !== undefined);

const fetchStateTreeForSelection = async (
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
const fetchTypeTags = async (
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
const fetchReversible = async (
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
const fetchCSSets = async (
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
  choices?: ReactionChoices;
  selection: ReactionOptions;
  editable: boolean;
  onConsumesChange(newSelected: Array<StatePath>): void | Promise<void>;
  onProducesChange(newSelected: Array<StatePath>): void | Promise<void>;
  onTagsChange(newSelected: Array<ReactionTypeTag>): void | Promise<void>;
  onReversibleChange(newSelected: Reversible): void | Promise<void>;
  onCSSetsChange(newSelected: Set<string>): void | Promise<void>;
  onChange(
    newChoices: ReactionChoices,
    ids: StateSelectIds
  ): void | Promise<void>;
};

export const StatefulReactionPicker = async ({
  ids,
  choices: initChoices,
  selection,
  editable,
  onChange,
  onConsumesChange,
  onProducesChange,
  onTagsChange,
  onCSSetsChange,
  onReversibleChange,
}: StatefulReactionPickerProps) => {
  const [unfoldedOrgs, setUnfoldedOrgs] = useState<Set<string>>(new Set());

  // TODO: initialize choices if undefined.
  const choices = initChoices ?? {
    consumes: [],
    produces: [],
    typeTags: await fetchTypeTags([], [], Reversible.Both, new Set()),
    reversible: await fetchReversible([], [], [], new Set()),
    set: await fetchCSSets([], [], [], Reversible.Both),
  };

  const update = async (type: UpdateType) => {
    const newLhsPaths = selection.consumes.map((selected, index) =>
      type.kind === "state" && type.side === "lhs" && type.index === index
        ? type.value ?? {}
        : selected
    );
    const newLhsSelected = newLhsPaths
      .map(getStateLeaf)
      .filter((selected): selected is StateLeaf => selected !== undefined);
    const newRhsPaths = selection.produces.map((selected, index) =>
      type.kind === "state" && type.side === "rhs" && type.index === index
        ? type.value ?? {}
        : selected
    );
    const newRhsSelected = newRhsPaths
      .map(getStateLeaf)
      .filter((selected): selected is StateLeaf => selected !== undefined);

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
        ? onConsumesChange(newLhsPaths)
        : onProducesChange(newRhsPaths);
    } else if (type.kind === "cs_set") {
      onCSSetsChange(newSelectedCSSets);
    }

    Promise.all([
      Promise.all(
        choices.consumes.map(async (data, index) => {
          if (
            type.kind === "state" &&
            type.side === "lhs" &&
            type.index === index
          ) {
            return type.value ? { data, selected: type.value } : undefined;
          }

          const consumed = newLhsSelected.filter((_, i) => i !== index);
          const produced = newRhsSelected;

          const tree = await fetchStateTreeForSelection(
            StateProcess.Consumed,
            consumed,
            produced,
            newSelectedTags,
            newSelectedReversible,
            newSelectedCSSets
          );

          return { data: tree, selected: selection.consumes[index] };
        })
      ).then((newConsumes) =>
        newConsumes.filter(
          (state): state is StateEntryProps => state !== undefined
        )
      ),
      Promise.all(
        choices.produces.map(async (data, index) => {
          if (
            type.kind === "state" &&
            type.side === "rhs" &&
            type.index === index
          ) {
            return type.value ? { data, selected: type.value } : undefined;
          }

          // Get selected states based on other boxes.
          const consumed = newLhsSelected;
          const produced = newRhsSelected.filter((_, i) => i !== index);

          const tree = await fetchStateTreeForSelection(
            StateProcess.Produced,
            consumed,
            produced,
            newSelectedTags,
            newSelectedReversible,
            newSelectedCSSets
          );

          return { data: tree, selected: selection.produces[index] };
        })
      ).then((newProduces) =>
        newProduces.filter(
          (state): state is StateEntryProps => state !== undefined
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
        onChange(newChoices, ids);
        if (
          (type.kind !== "type_tag" &&
            !arrayEquality(newSelectedTags, selection.type_tags)) ||
          // FIXME: This is inefficient (only one set needs to be converted to
          // an array).
          (type.kind !== "cs_set" &&
            !arrayEquality([...newSelectedCSSets], [...selection.set]))
        ) {
          if (type.kind === "state") {
            if (type.side === "lhs") {
              fetchStateTreeForSelection(
                StateProcess.Consumed,
                newLhsSelected.filter((_, i) => i !== type.index),
                newRhsSelected,
                newSelectedTags,
                newSelectedReversible,
                newSelectedCSSets
              ).then((tree) =>
                onChange(
                  {
                    ...newChoices,
                    consumes: newChoices.consumes.map((data, i) =>
                      type.index === i ? tree : data
                    ),
                  },
                  ids
                )
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
                onChange(
                  {
                    ...newChoices,
                    produces: newChoices.produces.map((data, i) =>
                      type.index === i ? tree : data
                    ),
                  },
                  ids
                )
              );
            }
          } else if (type.kind === "type_tag") {
            fetchTypeTags(
              newLhsSelected,
              newRhsSelected,
              newSelectedReversible,
              newSelectedCSSets
            ).then((typeTags) => onChange({ ...newChoices, typeTags }, ids));
          } else if (type.kind === "reversible") {
            fetchReversible(
              newLhsSelected,
              newRhsSelected,
              newSelectedTags,
              newSelectedCSSets
            ).then((reversible) =>
              onChange({ ...newChoices, reversible }, ids)
            );
          } else if (type.kind === "cs_set") {
            fetchCSSets(
              newLhsSelected,
              newRhsSelected,
              newSelectedTags,
              newSelectedReversible
            ).then((csSets) => onChange({ ...newChoices, set: csSets }, ids));
          }
        }
      }
    );
  };

  const initData = async (side: "lhs" | "rhs") =>
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
          const data = await initData("lhs");
          // lhsFieldArray.append({ data, selected: {} });
          // TODO: Generate new id.
          await onChange(
            { ...choices, consumes: [...choices.consumes, data] },
            { ...ids, consumes: [...ids.consumes, nanoid()] }
          );
          onConsumesChange([...selection.consumes, {}]);
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
          const data = await initData("rhs");
          await onChange(
            { ...choices, produces: [...choices.produces, data] },
            { ...ids, produces: [...ids.produces, nanoid()] }
          );
          onProducesChange([...selection.produces, {}]);
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
