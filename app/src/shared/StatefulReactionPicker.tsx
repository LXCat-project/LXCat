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
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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

const getSelectedStates = (entries: Array<StateEntryProps>): Array<StateLeaf> =>
  entries
    .map(({ selected }) => getStateLeaf(selected))
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

const isStateSelectionUpdated = (
  selected: Array<StateLeaf>,
  original: Array<StateLeaf>
) =>
  arrayEquality(selected, original, (first, second) => first.id === second.id);

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

interface ListValues {
  lhs: Array<StateEntryProps>;
  rhs: Array<StateEntryProps>;
}

export type StatefulReactionPickerProps = {
  onChange: (
    lhsSelected: Array<StatePath>,
    rhsSelected: Array<StatePath>,
    typeTags: Array<ReactionTypeTag>,
    reversible: Reversible,
    csSets: Set<string>
  ) => void | Promise<void>;
  viewOnly: boolean;
  initialValues?: {
    typeTags: Array<ReactionTypeTag>;
    selectedTags: Array<ReactionTypeTag>;
    reversible: Array<Reversible>;
    selectedReversible: Reversible;
    selectedCsSets: Set<string>;
    csSets: CSSetTree;
  } & ListValues;
};

export const StatefulReactionPicker = ({
  onChange,
  viewOnly,
  initialValues,
}: StatefulReactionPickerProps) => {
  const {
    lhs,
    rhs,
    typeTags: initTags,
    selectedTags: initSelectedTags,
    reversible: initReversible,
    selectedReversible: initSelectedReversible,
    selectedCsSets: initSelectedCsSets,
    csSets: initCsSets,
  } = initialValues ?? {
    lhs: [],
    rhs: [],
    typeTags: [],
    selectedTags: [],
    reversible: [Reversible.Both, Reversible.True, Reversible.False],
    selectedReversible: Reversible.Both,
    selectedCsSets: new Set(),
    csSets: {},
  };

  const { control } = useForm<ListValues>({ defaultValues: { lhs, rhs } });
  const lhsFieldArray = useFieldArray({ name: "lhs", control });
  const rhsFieldArray = useFieldArray({ name: "rhs", control });

  const [reversible, setReversible] =
    useState<Array<Reversible>>(initReversible);
  const [selectedReversible, setSelectedReversible] = useState<Reversible>(
    initSelectedReversible ?? Reversible.Both
  );

  const [typeTags, setTypeTags] = useState<Array<ReactionTypeTag>>(
    initTags ?? []
  );
  const [selectedTags, setSelectedTags] = useState<Array<ReactionTypeTag>>(
    initSelectedTags.filter((tag) => initTags.includes(tag))
  );

  const [lhsSelected, setLhsSelected] = useState<Array<StateLeaf>>(
    lhs ? getSelectedStates(lhs) : []
  );
  const [rhsSelected, setRhsSelected] = useState<Array<StateLeaf>>(
    rhs ? getSelectedStates(rhs) : []
  );

  const [csSets, setCSSets] = useState<CSSetTree>(initCsSets);
  const [unfoldedOrgs, setUnfoldedOrgs] = useState<Set<string>>(new Set());
  const [selectedCSSets, setSelectedCSSets] =
    useState<Set<string>>(initSelectedCsSets);

  // Used for initializing state.
  useEffect(() => {
    console.log(`[ReactionPicker]: Initializing state.`);
    if (!initialValues) {
      const effect = async () => {
        fetchTypeTags([], [], Reversible.Both, new Set()).then(setTypeTags);

        fetchReversible([], [], [], new Set()).then((newReversible) => {
          setReversible(newReversible);
          setSelectedReversible(
            newReversible.length > 1 ? Reversible.Both : newReversible[0]
          );
        });

        fetchCSSets([], [], [], Reversible.Both).then(setCSSets);
        fetchStateTreeForSelection(
          StateProcess.Consumed,
          [],
          [],
          [],
          Reversible.Both,
          new Set()
        ).then((data) =>
          lhsFieldArray.append({
            data,
            selected: {},
          })
        );
        fetchStateTreeForSelection(
          StateProcess.Produced,
          [],
          [],
          [],
          Reversible.Both,
          new Set()
        ).then((data) =>
          rhsFieldArray.append({
            data,
            selected: {},
          })
        );
      };
      effect().catch(console.error);
    }
  }, []);

  const update = async (type: UpdateType) => {
    const newLhsPaths = lhsFieldArray.fields.map(({ selected }, index) =>
      type.kind === "state" && type.side === "lhs" && type.index === index
        ? type.value ?? {}
        : selected
    );
    const newLhsSelected =
      type.kind === "state" && type.side === "lhs"
        ? newLhsPaths
            .map(getStateLeaf)
            .filter((selected): selected is StateLeaf => selected !== undefined)
        : lhsSelected;
    const newRhsPaths = rhsFieldArray.fields.map(({ selected }, index) =>
      type.kind === "state" && type.side === "rhs" && type.index === index
        ? type.value ?? {}
        : selected
    );
    const newRhsSelected =
      type.kind === "state" && type.side === "rhs"
        ? newRhsPaths
            .map(getStateLeaf)
            .filter((selected): selected is StateLeaf => selected !== undefined)
        : rhsSelected;
    const newSelectedReversible =
      type.kind === "reversible" ? type.value : selectedReversible;
    const newSelectedTags =
      type.kind === "type_tag" ? type.value : selectedTags;
    const newSelectedCSSets =
      type.kind === "cs_set" ? type.selected : selectedCSSets;

    if (type.kind === "type_tag") {
      setSelectedTags(newSelectedTags);
    } else if (type.kind === "reversible") {
      setSelectedReversible(newSelectedReversible);
    } else if (type.kind === "state") {
      type.side === "lhs"
        ? setLhsSelected(newLhsSelected)
        : setRhsSelected(newRhsSelected);
    } else if (type.kind === "cs_set") {
      setSelectedCSSets(newSelectedCSSets);
    }

    Promise.all([
      Promise.all(
        lhsFieldArray.fields.map(async ({ data, selected }, index) => {
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

          return { data: tree, selected };
        })
      ).then((newLhsStates) => {
        const filteredStates = newLhsStates.filter(
          (state): state is StateEntryProps => state !== undefined
        );
        lhsFieldArray.replace(filteredStates);
        return filteredStates;
      }),
      Promise.all(
        rhsFieldArray.fields.map(async ({ data, selected }, index) => {
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

          return { data: tree, selected };
        })
      ).then((newRhsStates) => {
        const filteredStates = newRhsStates.filter(
          (state): state is StateEntryProps => state !== undefined
        );
        rhsFieldArray.replace(filteredStates);
        return filteredStates;
      }),
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
            setSelectedTags(filteredTags);
            setTypeTags(newTags);
            return filteredTags;
          })
        : newSelectedTags,
      type.kind !== "reversible"
        ? fetchReversible(
            newLhsSelected,
            newRhsSelected,
            newSelectedTags,
            newSelectedCSSets
          ).then((newReversible) => {
            setReversible(newReversible);
            return newReversible;
          })
        : reversible,
      type.kind !== "cs_set"
        ? fetchCSSets(
            newLhsSelected,
            newRhsSelected,
            newSelectedTags,
            newSelectedReversible
          ).then((newCSSets) => {
            const sets = Object.values(newCSSets).flatMap((set) =>
              Object.keys(set.sets)
            );
            const filteredSelectedSets = new Set(
              [...newSelectedCSSets].filter((set) => sets.includes(set))
            );
            const filteredUnfoldedOrgs = new Set(
              [...unfoldedOrgs].filter((orgId) => orgId in newCSSets)
            );
            setSelectedCSSets(filteredSelectedSets);
            setUnfoldedOrgs(filteredUnfoldedOrgs);
            setCSSets(newCSSets);
            return filteredSelectedSets;
          })
        : newSelectedCSSets,
    ]).then(
      async ([
        newLhsStates,
        newRhsStates,
        newSelectedTags,
        _,
        newSelectedCSSets,
      ]) => {
        onChange(
          newLhsPaths,
          newRhsPaths,
          newSelectedTags,
          newSelectedReversible,
          newSelectedCSSets
        );
        if (
          (type.kind !== "type_tag" &&
            !arrayEquality(newSelectedTags, selectedTags)) ||
          // FIXME: This is inefficient (only one sets needs to be converted to
          // an array).
          (type.kind !== "cs_set" &&
            !arrayEquality([...newSelectedCSSets], [...selectedCSSets]))
        ) {
          if (type.kind === "state") {
            if (type.side === "lhs") {
              const tree = await fetchStateTreeForSelection(
                StateProcess.Consumed,
                newLhsSelected.filter((_, i) => i !== type.index),
                newRhsSelected,
                newSelectedTags,
                newSelectedReversible,
                newSelectedCSSets
              );
              newLhsStates[type.index].data = tree;
              lhsFieldArray.replace(newLhsStates);
            } else {
              fetchStateTreeForSelection(
                StateProcess.Produced,
                newLhsSelected,
                newRhsSelected.filter((_, i) => i !== type.index),
                newSelectedTags,
                newSelectedReversible,
                newSelectedCSSets
              ).then((tree) => {
                newRhsStates[type.index].data = tree;
                rhsFieldArray.replace(newRhsStates);
              });
            }
          } else if (type.kind === "type_tag") {
            fetchTypeTags(
              newLhsSelected,
              newRhsSelected,
              newSelectedReversible,
              newSelectedCSSets
            ).then(setTypeTags);
          } else if (type.kind === "reversible") {
            fetchReversible(
              newLhsSelected,
              newRhsSelected,
              newSelectedTags,
              newSelectedCSSets
            ).then(setReversible);
          } else if (type.kind === "cs_set") {
            fetchCSSets(
              newLhsSelected,
              newRhsSelected,
              newSelectedTags,
              newSelectedReversible
            ).then(setCSSets);
          }
        }
      }
    );
  };

  const initData = async (side: "lhs" | "rhs") => {
    const response = await fetch(
      `/api/states/partaking?${new URLSearchParams({
        stateProcess:
          side === "lhs" ? StateProcess.Consumed : StateProcess.Produced,
        consumes: JSON.stringify(lhsSelected),
        produces: JSON.stringify(rhsSelected),
        typeTags: JSON.stringify(selectedTags),
        reversible: selectedReversible,
        setIds: JSON.stringify([...selectedCSSets]),
      })}`
    );
    return await response.json();
  };

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

  return viewOnly ? (
    <ReactionPicker
      consumes={{
        entries: lhsFieldArray.fields,
        onAppend: async () => {
          const data = await initData("lhs");
          lhsFieldArray.append({ data, selected: {} });
        },
        onRemove: async (index) => {
          await update({ kind: "state", side: "lhs", index });
        },
        onUpdate: async (index, selected) =>
          update({ kind: "state", side: "lhs", index, value: selected }),
      }}
      produces={{
        entries: rhsFieldArray.fields,
        onAppend: async () => {
          const data = await initData("rhs");
          rhsFieldArray.append({ data, selected: {} });
        },
        onRemove: async (index) =>
          update({ kind: "state", side: "rhs", index }),
        onUpdate: async (index, selected) =>
          update({ kind: "state", side: "rhs", index, value: selected }),
      }}
      reversible={{
        onChange: (value) =>
          update({ kind: "reversible", value: value as Reversible }),
        choices: reversible,
        value: selectedReversible,
      }}
      typeTags={{
        data: typeTags,
        value: selectedTags,
        onChange: (newTags: Array<ReactionTypeTag>) =>
          update({ kind: "type_tag", value: newTags }),
      }}
      sets={{
        data: csSets,
        selection: selectedCSSets,
        unfolded: unfoldedOrgs,
        onSetChecked(setId, checked) {
          const newSelectedCSSets = new Set(selectedCSSets);

          checked
            ? newSelectedCSSets.add(setId)
            : newSelectedCSSets.delete(setId);

          update({ kind: "cs_set", selected: newSelectedCSSets });
        },
        onOrganizationChecked(id, checked) {
          const newSelectedCSSets = new Set(selectedCSSets);

          Object.keys(csSets[id].sets).forEach((setId) => {
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
    getLatexForReaction(
      {
        consumes: lhsFieldArray.fields.map((field) => field.data),
        produces: rhsFieldArray.fields.map((field) => field.data),
        reversible,
        typeTags,
        set: csSets,
      },
      {
        consumes: lhsFieldArray.fields.map((field) => field.selected),
        produces: rhsFieldArray.fields.map((field) => field.selected),
        reversible: selectedReversible,
        type_tags: selectedTags,
        set: [...selectedCSSets],
      }
    )
  );
};
