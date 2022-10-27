import {
  ReactionSummary,
  StateProcess,
  StateSelectionEntry,
} from "@lxcat/database/dist/cs/queries/public";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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

const getSelectedStates = (
  entries: Array<StateEntryProps>
): Array<StateSelectionEntry> =>
  entries
    .map(({ selected }) => getSelectedState(selected))
    .filter((id): id is StateSelectionEntry => id !== undefined);

export interface ListValues {
  lhs: Array<StateEntryProps>;
  rhs: Array<StateEntryProps>;
}

/* Strategy
 *
 * On state select update:
 *  - Detect which entry has been updated.
 *  - Compute new reactions and display new reactions (as this is immediately
 *  visible to the user).
 *  - Update the selection data of the other selection boxes.
 */

const ScatteringCrossSectionsPage: NextPage<Props> = () => {
  const { control, getValues } = useForm<ListValues>();
  console.log(getValues())
  const lhsFieldArray = useFieldArray({ name: "lhs", control });
  const rhsFieldArray = useFieldArray({ name: "rhs", control });

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
    newSelected: StateSelection,
    selectedTags: Array<ReactionTypeTag>
  ) => {
    return Promise.all([
      ...lhsFieldArray.fields.map(async ({ selected }, index) => {
        if (!(side === "lhs" && index === updatedIndex)) {
          // Get selected states based on other boxes.
          const consumed = lhsFieldArray.fields
            .map((field, i) =>
              i !== index
                ? getSelectedState(
                    side === "lhs" && i === updatedIndex
                      ? newSelected
                      : field.selected
                  )
                : undefined
            )
            .filter((selected) => selected !== undefined);
          const produced = rhsFieldArray.fields
            .map((field, i) =>
              getSelectedState(
                side === "rhs" && i === updatedIndex
                  ? newSelected
                  : field.selected
              )
            )
            .filter((selected) => selected !== undefined);

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

          lhsFieldArray.update(index, {
            data: await response.json(),
            selected,
          });
        }
      }),
      ...rhsFieldArray.fields.map(async ({ selected }, index) => {
        if (!(side === "rhs" && index === updatedIndex)) {
          // Get selected states based on other boxes.
          const consumed = lhsFieldArray.fields
            .map((field, i) =>
              getSelectedState(
                side === "lhs" && i === updatedIndex
                  ? newSelected
                  : field.selected
              )
            )
            .filter(
              (selected): selected is StateSelectionEntry =>
                selected !== undefined
            );
          const produced = rhsFieldArray.fields
            .map((field, i) =>
              i !== index
                ? getSelectedState(
                    side === "rhs" && i === updatedIndex
                      ? newSelected
                      : field.selected
                  )
                : undefined
            )
            .filter(
              (selected): selected is StateSelectionEntry =>
                selected !== undefined
            );

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

          rhsFieldArray.update(index, {
            data: await response.json(),
            selected,
          });
        }
      }),
    ]);
  };

  useEffect(() => {
    const newLhs = getSelectedStates(lhsFieldArray.fields);
    if (
      newLhs.length !== lhsSelected.length ||
      !lhsSelected.every(
        ({ id, includeChildren }, index) =>
          id === newLhs[index].id &&
          includeChildren === newLhs[index].includeChildren
      )
    ) {
      setLhsSelected(newLhs);
    }
    const newRhs = getSelectedStates(rhsFieldArray.fields);
    if (
      newRhs.length !== rhsSelected.length ||
      !rhsSelected.every(
        ({ id, includeChildren }, index) =>
          id === newRhs[index].id &&
          includeChildren === newRhs[index].includeChildren
      )
    ) {
      setRhsSelected(newRhs);
    }
  }, [lhsFieldArray.fields, rhsFieldArray.fields, lhsSelected, rhsSelected]);

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
    console.log(selectedTags.filter((tag) => newTags.includes(tag)));
  }, [reactions, selectedTags]);

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
        onUpdate: async (index, selected) => {
          lhsFieldArray.update(index, {
            selected,
            data: lhsFieldArray.fields[index].data,
          });
          return updateData(index, "lhs", selected, selectedTags);
        },
      }}
      produces={{
        entries: rhsFieldArray.fields,
        onAppend: async () => {
          const data = await initData("rhs");
          rhsFieldArray.append({ data, selected: {} });
        },
        onRemove: async (index) => {
          await updateData(index, "rhs", {}, selectedTags);
          rhsFieldArray.remove(index);
        },
        onUpdate: async (index, selected) => {
          rhsFieldArray.update(index, {
            selected,
            data: rhsFieldArray.fields[index].data,
          });
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
