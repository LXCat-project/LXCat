import {
  ReactionSummary,
  StateProcess,
  StateSelectionEntry,
} from "@lxcat/database/dist/cs/queries/public";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ReactionPicker } from "./ReactionPicker";
import { OMIT_CHILDREN_KEY, StateSelection, StateTree } from "./StateSelect";
import { arrayEquality } from "./utils";

interface StateEntryProps {
  data: StateTree;
  selected: StateSelection;
}

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
  typeTags: Array<ReactionTypeTag>
) =>
  fetch(
    `/api/states/partaking?${new URLSearchParams({
      stateProcess: stateProcess,
      consumes: JSON.stringify(consumes),
      produces: JSON.stringify(produces),
      typeTags: JSON.stringify(typeTags),
    })}`
  );

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
  onChange: (reactions: Array<ReactionSummary>) => void | Promise<void>;
  typeTags?: Array<ReactionTypeTag>;
  selectedTags?: Array<ReactionTypeTag>;
} & Partial<ListValues>;

export const StatefulReactionPicker = ({
  lhs,
  rhs,
  typeTags: initTags,
  selectedTags: initSelectedTags,
  onChange,
}: StatefulReactionPickerProps) => {
  const { control } = useForm<ListValues>({ defaultValues: { lhs, rhs } });
  const lhsFieldArray = useFieldArray({ name: "lhs", control });
  const rhsFieldArray = useFieldArray({ name: "rhs", control });

  const [typeTags, setTypeTags] = useState<Array<ReactionTypeTag>>(
    initTags ?? []
  );
  const [selectedTags, setSelectedTags] = useState<Array<ReactionTypeTag>>(
    initSelectedTags?.filter((tag) => initTags?.includes(tag)) ?? []
  );

  const [lhsSelected, setLhsSelected] = useState<Array<StateSelectionEntry>>(
    lhs ? getSelectedStates(lhs) : []
  );
  const [rhsSelected, setRhsSelected] = useState<Array<StateSelectionEntry>>(
    rhs ? getSelectedStates(rhs) : []
  );

  const initData = async (side: "lhs" | "rhs") => {
    const consumed = lhsFieldArray.fields
      .map(({ selected }) => getSelectedState(selected))
      .filter((state): state is StateSelectionEntry => state !== undefined);
    const produced = rhsFieldArray.fields
      .map(({ selected }) => getSelectedState(selected))
      .filter((state): state is StateSelectionEntry => state !== undefined);
    const response = await fetch(
      `/api/states/partaking?${new URLSearchParams({
        stateProcess:
          side === "lhs" ? StateProcess.Consumed : StateProcess.Produced,
        consumes: JSON.stringify(consumed),
        produces: JSON.stringify(produced),
        typeTags: JSON.stringify(selectedTags),
      })}`
    );
    return await response.json();
  };

  const updateData = async (
    updatedIndex: number,
    side: "lhs" | "rhs",
    newSelected: StateSelection | undefined,
    selectedTags: Array<ReactionTypeTag>
  ) => {
    const newLhsSelected = lhsFieldArray.fields
      .map(({ selected }, index) =>
        getSelectedState(
          side == "lhs" && index == updatedIndex ? newSelected ?? {} : selected
        )
      )
      .filter(
        (selected): selected is StateSelectionEntry => selected !== undefined
      );

    const newRhsSelected = rhsFieldArray.fields
      .map(({ selected }, index) =>
        getSelectedState(
          side == "rhs" && index == updatedIndex ? newSelected ?? {} : selected
        )
      )
      .filter(
        (selected): selected is StateSelectionEntry => selected !== undefined
      );

    const [newLhsStates, newRhsStates] = await Promise.all([
      Promise.all(
        lhsFieldArray.fields.map(async ({ data, selected }, index) => {
          if (side === "lhs" && index === updatedIndex) {
            return { data, selected: newSelected };
          }

          // Get selected states based on other boxes.
          const consumed = newLhsSelected.filter((_, i) => i !== index);
          const produced = newRhsSelected;

          const response = await fetchStateTreeForSelection(
            StateProcess.Consumed,
            consumed,
            produced,
            selectedTags
          );

          return { data: (await response.json()) as StateTree, selected };
        })
      ),
      Promise.all(
        rhsFieldArray.fields.map(async ({ data, selected }, index) => {
          if (side === "rhs" && index === updatedIndex) {
            return newSelected ? { data, selected: newSelected } : undefined;
          }

          // Get selected states based on other boxes.
          const consumed = newLhsSelected;
          const produced = newRhsSelected.filter((_, i) => i !== index);

          const response = await fetchStateTreeForSelection(
            StateProcess.Produced,
            consumed,
            produced,
            selectedTags
          );

          return { data: (await response.json()) as StateTree, selected };
        })
      ),
    ]);

    lhsFieldArray.replace(
      newLhsStates.filter(
        (state): state is StateEntryProps => state !== undefined
      )
    );
    rhsFieldArray.replace(
      newRhsStates.filter(
        (state): state is StateEntryProps => state !== undefined
      )
    );

    if (isStateSelectionUpdated(newLhsSelected, lhsSelected)) {
      setLhsSelected(newLhsSelected);
    }
    if (isStateSelectionUpdated(newRhsSelected, rhsSelected)) {
      setRhsSelected(newRhsSelected);
    }
  };

  const fetchReactions = async () =>
    (
      await fetch(
        `/api/reactions?${new URLSearchParams({
          consumes: JSON.stringify(lhsSelected),
          produces: JSON.stringify(rhsSelected),
        })}`
      )
    ).json() as Promise<Array<ReactionSummary>>;

  useEffect(() => {
    const updateReactions = async () => {
      const reactions: Array<ReactionSummary> = await fetchReactions();
      const newTags = [
        ...new Set(reactions.flatMap((reaction) => reaction.typeTags)),
      ];

      setTypeTags(newTags);

      const newSelectedTags = selectedTags.filter((tag) =>
        newTags.includes(tag)
      );

      onChange(
        newSelectedTags.length === 0
          ? reactions
          : reactions.filter((reaction) =>
              reaction.typeTags.some((tag) => newSelectedTags.includes(tag))
            )
      );

      if (arrayEquality(newSelectedTags, selectedTags)) {
        setSelectedTags(newSelectedTags);
      }
    };
    updateReactions().catch(console.error);
  }, [lhsSelected, rhsSelected]);

  useEffect(() => {
    const update = async () => {
      updateData(-1, "lhs", {}, selectedTags);
      onChange(await fetchReactions());
    };
    update().catch(console.error);
  }, [selectedTags]);

  return (
    <ReactionPicker
      consumes={{
        entries: lhsFieldArray.fields,
        onAppend: async () => {
          const data = await initData("lhs");
          lhsFieldArray.append({ data, selected: {} });
        },
        onRemove: async (index) => {
          await updateData(index, "lhs", {}, selectedTags);
          lhsFieldArray.remove(index);
        },
        onUpdate: async (index, selected) =>
          updateData(index, "lhs", selected, selectedTags),
      }}
      produces={{
        entries: rhsFieldArray.fields,
        onAppend: async () => {
          const data = await initData("rhs");
          rhsFieldArray.append({ data, selected: {} });
        },
        onRemove: async (index) =>
          updateData(index, "rhs", undefined, selectedTags),
        onUpdate: async (index, selected) =>
          updateData(index, "rhs", selected, selectedTags),
      }}
      typeTags={{
        data: typeTags,
        value: selectedTags,
        onChange: (newTags: Array<ReactionTypeTag>) => setSelectedTags(newTags),
      }}
    />
  );
};
