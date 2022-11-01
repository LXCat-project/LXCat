import {
  Reversible,
  StateProcess,
  StateSelectionEntry,
} from "@lxcat/database/dist/cs/queries/public";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { CSSetTree } from "./CSSetFilter";
import { ReactionPicker } from "./ReactionPicker";
import { OMIT_CHILDREN_KEY, StateSelection, StateTree } from "./StateSelect";
import { arrayEquality } from "./utils";

// TODO: Include organization and set selection in the reaction search.

interface StateEntryProps {
  data: StateTree;
  selected: StateSelection;
}

interface StateSelectUpdate {
  kind: "state";
  side: "lhs" | "rhs";
  index: number;
  value?: StateSelection;
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

const getSelectedState = ({
  particle,
  electronic,
  vibrational,
  rotational,
}: StateSelection): StateSelectionEntry | undefined => {
  if (particle) {
    if (electronic) {
      if (electronic === OMIT_CHILDREN_KEY) {
        return { id: particle, includeChildren: false };
      } else if (vibrational) {
        if (vibrational === OMIT_CHILDREN_KEY) {
          return { id: electronic, includeChildren: false };
        } else if (rotational) {
          if (rotational === OMIT_CHILDREN_KEY) {
            return { id: vibrational, includeChildren: false };
          }
          return { id: rotational, includeChildren: false };
        }
        return { id: vibrational, includeChildren: true };
      }
      return { id: electronic, includeChildren: true };
    }
    return { id: particle, includeChildren: true };
  }

  return undefined;
};

const getSelectedStates = (
  entries: Array<StateEntryProps>
): Array<StateSelectionEntry> =>
  entries
    .map(({ selected }) => getSelectedState(selected))
    .filter((id): id is StateSelectionEntry => id !== undefined);

const fetchStateTreeForSelection = async (
  stateProcess: StateProcess,
  consumes: Array<StateSelectionEntry>,
  produces: Array<StateSelectionEntry>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible
) =>
  (
    await fetch(
      `/api/states/partaking?${new URLSearchParams({
        stateProcess: stateProcess,
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        reversible,
      })}`
    )
  ).json() as Promise<StateTree>;

const isStateSelectionUpdated = (
  selected: Array<StateSelectionEntry>,
  original: Array<StateSelectionEntry>
) =>
  arrayEquality(selected, original, (first, second) => first.id === second.id);

interface ListValues {
  lhs: Array<StateEntryProps>;
  rhs: Array<StateEntryProps>;
}

export type StatefulReactionPickerProps = {
  onChange: (reactions: Array<string>) => void | Promise<void>;
  initialValues?: {
    typeTags: Array<ReactionTypeTag>;
    selectedTags: Array<ReactionTypeTag>;
    reversible: Array<Reversible>;
    selectedReversible: Reversible;
  } & ListValues;
};

export const StatefulReactionPicker = ({
  onChange,
  initialValues,
}: StatefulReactionPickerProps) => {
  const {
    lhs,
    rhs,
    typeTags: initTags,
    selectedTags: initSelectedTags,
    reversible: initReversible,
    selectedReversible: initSelectedReversible,
  } = initialValues ?? {
    lhs: [],
    rhs: [],
    typeTags: [],
    selectedTags: [],
    reversible: [Reversible.Both, Reversible.True, Reversible.False],
    selectedReversible: Reversible.Both,
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

  const [lhsSelected, setLhsSelected] = useState<Array<StateSelectionEntry>>(
    lhs ? getSelectedStates(lhs) : []
  );
  const [rhsSelected, setRhsSelected] = useState<Array<StateSelectionEntry>>(
    rhs ? getSelectedStates(rhs) : []
  );

  const [csSets, setCSSets] = useState<CSSetTree>({
    "1": {
      name: "IST Lisbon",
      unfolded: true,
      sets: {
        "1": "Set one",
        "2": "Set two",
      },
    },
    "2": { name: "Phelps", unfolded: false, sets: {} },
  });
  const [selectedCSSets, setSelectedCSSets] = useState<Set<string>>(
    new Set(["1"])
  );

  // Used for initializing state.
  useEffect(() => {
    if (!initialValues) {
      const effect = async () => {
        const newTags = await fetchTypeTags([], [], Reversible.Both);
        setTypeTags(newTags);

        const newReversible = await fetchReversible([], [], []);
        setReversible(newReversible);
        setSelectedReversible(
          newReversible.length > 1 ? Reversible.Both : newReversible[0]
        );
      };
      effect().catch(console.error);
    }
  }, []);

  const update = async (type: UpdateType) => {
    const newLhsSelected =
      type.kind === "state" && type.side === "lhs"
        ? lhsFieldArray.fields
            .map(({ selected }, index) =>
              getSelectedState(
                type.kind === "state" &&
                  type.side === "lhs" &&
                  type.index === index
                  ? type.value ?? {}
                  : selected
              )
            )
            .filter(
              (selected): selected is StateSelectionEntry =>
                selected !== undefined
            )
        : lhsSelected;
    const newRhsSelected =
      type.kind === "state" && type.side === "rhs"
        ? rhsFieldArray.fields
            .map(({ selected }, index) =>
              getSelectedState(
                type.index === index ? type.value ?? {} : selected
              )
            )
            .filter(
              (selected): selected is StateSelectionEntry =>
                selected !== undefined
            )
        : rhsSelected;
    const newSelectedReversible =
      type.kind === "reversible" ? type.value : selectedReversible;
    const newSelectedTags =
      type.kind === "type_tag" ? type.value : selectedTags;
    const newSelectedCSSet =
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
      setSelectedCSSets(newSelectedCSSet);
    }

    fetchReactions(
      newLhsSelected,
      newRhsSelected,
      newSelectedTags,
      newSelectedReversible
    ).then((reactions) => onChange(reactions));

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
            newSelectedReversible
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
            newSelectedReversible
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
            newSelectedReversible
          ).then(async (newTags) => {
            const filteredTags = newSelectedTags.filter((tag) =>
              newTags.includes(tag)
            );
            setSelectedTags(filteredTags);
            setTypeTags(newTags);
            return filteredTags;
          })
        : typeTags,
      type.kind !== "reversible"
        ? fetchReversible(newLhsSelected, newRhsSelected, newSelectedTags).then(
            (newReversible) => {
              setReversible(newReversible);
              return newReversible;
            }
          )
        : reversible,
      type.kind !== "cs_set"
        ? fetchCSSets(
            newLhsSelected,
            newRhsSelected,
            newSelectedTags,
            newSelectedReversible
          ).then((newCSSets) => {
            setCSSets(newCSSets);
            return newCSSets;
          })
        : csSets,
    ]).then(async ([newLhsStates, newRhsStates, newSelectedTags, _]) => {
      if (
        type.kind !== "type_tag" &&
        !arrayEquality(newSelectedTags, selectedTags)
      ) {
        if (type.kind === "state") {
          if (type.side === "lhs") {
            const tree = await fetchStateTreeForSelection(
              StateProcess.Consumed,
              newLhsSelected.filter((_, i) => i !== type.index),
              newRhsSelected,
              newSelectedTags,
              newSelectedReversible
            );
            newLhsStates[type.index].data = tree;
            lhsFieldArray.replace(newLhsStates);
          } else {
            fetchStateTreeForSelection(
              StateProcess.Produced,
              newLhsSelected,
              newRhsSelected.filter((_, i) => i !== type.index),
              newSelectedTags,
              newSelectedReversible
            ).then((tree) => {
              newRhsStates[type.index].data = tree;
              rhsFieldArray.replace(newRhsStates);
            });
          }
        } else if (type.kind === "reversible") {
          fetchReversible(newLhsSelected, newRhsSelected, newSelectedTags).then(
            (newReversible) => {
              setReversible(newReversible);
            }
          );
        }
      }
    });
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
      })}`
    );
    return await response.json();
  };

  const fetchReactions = async (
    consumes: Array<StateSelectionEntry>,
    produces: Array<StateSelectionEntry>,
    typeTags: Array<ReactionTypeTag>,
    reversible: Reversible
  ) =>
    (
      await fetch(
        `/api/reactions?${new URLSearchParams({
          consumes: JSON.stringify(consumes),
          produces: JSON.stringify(produces),
          typeTags: JSON.stringify(typeTags),
          reversible,
        })}`
      )
    ).json() as Promise<Array<string>>;
  const fetchTypeTags = async (
    consumes: Array<StateSelectionEntry>,
    produces: Array<StateSelectionEntry>,
    reversible: Reversible
  ) =>
    (
      await fetch(
        `/api/reactions/type_tags?${new URLSearchParams({
          consumes: JSON.stringify(consumes),
          produces: JSON.stringify(produces),
          reversible,
        })}`
      )
    ).json() as Promise<Array<ReactionTypeTag>>;
  const fetchReversible = async (
    consumes: Array<StateSelectionEntry>,
    produces: Array<StateSelectionEntry>,
    typeTags: Array<ReactionTypeTag>
  ) =>
    (
      await fetch(
        `/api/reactions/reversible?${new URLSearchParams({
          consumes: JSON.stringify(consumes),
          produces: JSON.stringify(produces),
          typeTags: JSON.stringify(typeTags),
        })}`
      )
    ).json() as Promise<Array<Reversible>>;
  const fetchCSSets = async (
    consumes: Array<StateSelectionEntry>,
    produces: Array<StateSelectionEntry>,
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
    ).json();

  return (
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
        onSetChecked(setId, checked) {
          const newSelectedCSSets = new Set(selectedCSSets);

          checked
            ? newSelectedCSSets.add(setId)
            : newSelectedCSSets.delete(setId);

          setSelectedCSSets(newSelectedCSSets);
        },
        onOrganizationChecked(id, checked) {
          const newSelectedCSSets = new Set(selectedCSSets);

          Object.keys(csSets[id].sets).forEach((setId) => {
            checked
              ? newSelectedCSSets.add(setId)
              : newSelectedCSSets.delete(setId);
          });

          setSelectedCSSets(newSelectedCSSets);
        },
        onOrganizationUnfolded(id, unfolded) {
          const newTree = { ...csSets };
          newTree[id].unfolded = unfolded;

          setCSSets(newTree);
        },
      }}
    />
  );
};
