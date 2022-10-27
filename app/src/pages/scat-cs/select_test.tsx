import {
  ReactionSummary,
  StateProcess,
  StateSelectionEntry,
} from "@lxcat/database/dist/cs/queries/public";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { NextPage } from "next";
import { useEffect, useState } from "react";
// import { useFieldArray, useForm } from "react-hook-form";
import { ReactionPicker } from "../../shared/ReactionPicker";
import {
  OMIT_CHILDREN_KEY,
  StateSelection,
  StateTree,
} from "../../shared/StateSelect";

/* ##TODO
 *  -
 *
 */

interface Props {}

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

// const getSelectedStates = (
//   entries: Array<StateEntryProps>
// ): Array<StateSelectionEntry> =>
//   entries
//     .map(({ selected }) => getSelectedState(selected))
//     .filter((id): id is StateSelectionEntry => id !== undefined);

// interface ListValues {
//   lhs: Array<StateEntryProps>;
//   rhs: Array<StateEntryProps>;
// }

/* Strategy
 *
 * On state select update:
 *  - Detect which entry has been updated.
 *  - Compute new reactions and display new reactions (as this is immediately
 *  visible to the user).
 *  - Update the selection data of the other selection boxes.
 */

const isStateSelectionUpdated = (
  selected: Array<StateSelectionEntry>,
  original: Array<StateSelectionEntry>
): boolean => {
  if (selected.length !== original.length) {
    return false;
  } else {
    return selected.every((state, index) => state === original[index]);
  }
};

const makeLatexStateId = (
  { particle, electronic, vibrational, rotational }: StateSelection,
  tree: StateTree
): string => {
  if (particle) {
    const particleNode = tree[particle];
    let id = `${particleNode.latex}`;
    if (particleNode.children && electronic) {
      const electronicNode = particleNode.children[electronic];
      id += `\\left(${electronicNode.latex}`;
      if (electronicNode.children && vibrational) {
        const vibrationalNode = electronicNode.children[vibrational];
        id += `\\left(${vibrationalNode.latex}`;
        if (vibrationalNode.children && rotational) {
          id += `\\left(${vibrationalNode.children[rotational].latex}\\right`;
        }
        id += `\\right)`;
      }
      id += `\\right)`;
    }
    return id;
  }
  return "";
};

const ScatteringCrossSectionsPage: NextPage<Props> = () => {
  // TODO: Replace FieldArrays with normal useState hooks.
  // const { control } = useForm<ListValues>();
  // const lhsFieldArray = useFieldArray({ name: "lhs", control });
  // const rhsFieldArray = useFieldArray({ name: "rhs", control });

  const [lhsStates, setLhsStates] = useState<Array<StateEntryProps>>([]);
  const [rhsStates, setRhsStates] = useState<Array<StateEntryProps>>([]);

  const [reactions, setReactions] = useState<Array<ReactionSummary>>([]);
  // TODO: Rerender changed box when intersection of selected and total type
  // tags changes. For example, select H2 on the lhs and the `electronic` and
  // `vibrational` type tags. Then, select CO2 instead of H2, and remove the
  // remaining `vibrational` tag. Finally, switch back to H2 (the `electronic`
  // tag will reappear) and CO2 will now still be an option while it should be
  // constrained by the `electronic` type tag.
  const [typeTags, setTypeTags] = useState<Array<ReactionTypeTag>>([]);
  const [selectedTags, setSelectedTags] = useState<Array<ReactionTypeTag>>([]);

  const [lhsSelected, setLhsSelected] = useState<Array<StateSelectionEntry>>(
    []
  );
  const [rhsSelected, setRhsSelected] = useState<Array<StateSelectionEntry>>(
    []
  );

  const initData = async (side: "lhs" | "rhs") => {
    const consumed = lhsStates
      .map(({ selected }) => getSelectedState(selected))
      .filter((state): state is StateSelectionEntry => state !== undefined);
    const produced = rhsStates
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

  // const fetchStateTreeForSelection = (
  //   stateProcess: StateProcess,
  //   consumes: Array<StateSelectionEntry>,
  //   produces: Array<StateSelectionEntry>,
  //   typeTags: Array<ReactionTypeTag>
  // ) => {};

  const updateData = async (
    updatedIndex: number,
    side: "lhs" | "rhs",
    newSelected: StateSelection,
    selectedTags: Array<ReactionTypeTag>
  ) => {
    const newLhsSelected = lhsSelected
      .map((selected, index) =>
        side == "lhs" && index == updatedIndex
          ? getSelectedState(newSelected)
          : selected
      )
      .filter(
        (selected): selected is StateSelectionEntry => selected !== undefined
      );
    const newRhsSelected = rhsSelected
      .map((selected, index) =>
        side == "rhs" && index == updatedIndex
          ? getSelectedState(newSelected)
          : selected
      )
      .filter(
        (selected): selected is StateSelectionEntry => selected !== undefined
      );

    const [newLhsStates, newRhsStates] = await Promise.all([
      Promise.all(
        lhsStates.map(async ({ data, selected }, index) => {
          if (side === "lhs" && index === updatedIndex) {
            return { data, selected };
          }

          // Get selected states based on other boxes.
          const consumed = newLhsSelected.filter((_, i) => i !== index);
          const produced = newRhsSelected;

          const response = await fetch(
            `/api/states/partaking?${new URLSearchParams({
              stateProcess: StateProcess.Consumed,
              consumes: JSON.stringify(consumed),
              produces: JSON.stringify(produced),
              typeTags: JSON.stringify(
                selectedTags.filter((tag) => typeTags.includes(tag))
              ),
            })}`
          );

          return { data: (await response.json()) as StateTree, selected };
        })
      ),
      Promise.all(
        rhsStates.map(async ({ data, selected }, index) => {
          if (side === "rhs" && index === updatedIndex) {
            return { data, selected };
          }

          // Get selected states based on other boxes.
          const consumed = newLhsSelected;
          const produced = newRhsSelected.filter((_, i) => i !== index);

          const response = await fetch(
            `/api/states/partaking?${new URLSearchParams({
              stateProcess: StateProcess.Produced,
              consumes: JSON.stringify(consumed),
              produces: JSON.stringify(produced),
              typeTags: JSON.stringify(
                selectedTags.filter((tag) => typeTags.includes(tag))
              ),
            })}`
          );

          return { data: (await response.json()) as StateTree, selected };
        })
      ),
    ]);

    if (isStateSelectionUpdated(newLhsSelected, lhsSelected)) {
      setLhsSelected(newLhsSelected);
    }
    if (isStateSelectionUpdated(newRhsSelected, rhsSelected)) {
      setRhsSelected(newRhsSelected);
    }
    setLhsStates(newLhsStates);
    setRhsStates(newRhsStates);
  };

  // useEffect(() => {
  //   const newLhs = getSelectedStates(lhsFieldArray.fields);
  //   if (
  //     newLhs.length !== lhsSelected.length ||
  //     !lhsSelected.every(
  //       ({ id, includeChildren }, index) =>
  //         id === newLhs[index].id &&
  //         includeChildren === newLhs[index].includeChildren
  //     )
  //   ) {
  //     setLhsSelected(newLhs);
  //   }
  //   const newRhs = getSelectedStates(rhsFieldArray.fields);
  //   if (
  //     newRhs.length !== rhsSelected.length ||
  //     !rhsSelected.every(
  //       ({ id, includeChildren }, index) =>
  //         id === newRhs[index].id &&
  //         includeChildren === newRhs[index].includeChildren
  //     )
  //   ) {
  //     setRhsSelected(newRhs);
  //   }
  // }, [lhsFieldArray.fields, rhsFieldArray.fields, lhsSelected, rhsSelected]);

  useEffect(() => {
    const updateReactions = async () => {
      const response = await fetch(
        `/api/reactions?${new URLSearchParams({
          consumes: JSON.stringify(lhsSelected),
          produces: JSON.stringify(rhsSelected),
        })}`
      );
      setReactions(await response.json());
    };
    updateReactions().catch(console.error);
  }, [lhsSelected, rhsSelected]);

  useEffect(() => {
    console.log(reactions);
    const newTags = [
      ...new Set(reactions.flatMap((reaction) => reaction.typeTags)),
    ];
    setTypeTags(newTags);
    setSelectedTags(selectedTags.filter((tag) => newTags.includes(tag)));
  }, [reactions]);

  return (
    <ReactionPicker
      consumes={{
        entries: lhsStates.map(({ selected, data }) => ({
          id: makeLatexStateId(selected, data),
          selected,
          data,
        })),
        onAppend: async () => {
          const data = await initData("lhs");
          setLhsStates([...lhsStates, { data, selected: {} }]);
        },
        onRemove: async (index) => {
          await updateData(index, "lhs", {}, selectedTags);
          lhsFieldArray.remove(index);
        },
        onUpdate: async (index, selected) => {
          return updateData(index, "lhs", selected, selectedTags);
        },
      }}
      produces={{
        entries: rhsStates.map(({ selected, data }) => ({
          id: makeLatexStateId(selected, data),
          selected,
          data,
        })),
        onAppend: async () => {
          const data = await initData("rhs");
          setRhsStates([...lhsStates, { data, selected: {} }]);
        },
        onRemove: async (index) => {
          await updateData(index, "rhs", {}, selectedTags);
          rhsFieldArray.remove(index);
        },
        onUpdate: async (index, selected) => {
          return updateData(index, "rhs", selected, selectedTags);
        },
      }}
      typeTags={{
        data: typeTags,
        onChange: async (newTags: Array<ReactionTypeTag>) => {
          setSelectedTags(newTags);
          return updateData(-1, "lhs", {}, newTags);
        },
      }}
    />
  );
};

export default ScatteringCrossSectionsPage;
