import { StateProcess } from "@lxcat/database/dist/cs/queries/public";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ReactionPicker } from "../../shared/ReactionPicker";
import { StateSelection, StateTree } from "../../shared/StateSelect";

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
}: StateSelection): string | undefined =>
  rotational ?? vibrational ?? electronic ?? particle;

const getSelectedStates = (entries: Array<StateEntryProps>): Array<string> =>
  entries
    .map(({ selected }) => getSelectedState(selected))
    .filter((id): id is string => id !== undefined);

interface ListValues {
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
  const { control } = useForm<ListValues>();
  const lhsFieldArray = useFieldArray({ name: "lhs", control });
  const rhsFieldArray = useFieldArray({ name: "rhs", control });

  const [reactions, setReactions] = useState<Array<string>>([]);
  const [lhsSelected, setLhsSelected] = useState<Array<string>>([]);
  const [rhsSelected, setRhsSelected] = useState<Array<string>>([]);

  const initData = async (side: "lhs" | "rhs") => {
    const consumed = lhsFieldArray.fields
      .map(({ selected }) => getSelectedState(selected))
      .filter((state): state is string => state !== undefined);
    const produced = rhsFieldArray.fields
      .map(({ selected }) => getSelectedState(selected))
      .filter((state): state is string => state !== undefined);
    const response = await fetch(
      `/api/states/partaking?${new URLSearchParams({
        stateProcess:
          side === "lhs" ? StateProcess.Consumed : StateProcess.Produced,
        consumes: JSON.stringify(consumed),
        produces: JSON.stringify(produced),
      })}`
    );
    return await response.json();
  };

  const updateData = async (
    updatedIndex: number,
    side: "lhs" | "rhs",
    newSelected: StateSelection
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
            .filter((selected) => selected !== undefined);
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
            .filter((selected) => selected !== undefined);

          const response = await fetch(
            `/api/states/partaking?${new URLSearchParams({
              stateProcess: StateProcess.Produced,
              consumes: JSON.stringify(consumed),
              produces: JSON.stringify(produced),
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
      !lhsSelected.every((id, index) => id === newLhs[index])
    ) {
      setLhsSelected(newLhs);
    }
    const newRhs = getSelectedStates(rhsFieldArray.fields);
    if (
      newRhs.length !== rhsSelected.length ||
      !rhsSelected.every((id, index) => id === newRhs[index])
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
  }, [reactions]);

  return (
    <ReactionPicker
      consumes={{
        entries: lhsFieldArray.fields,
        onAppend() {
          const doAppend = async () => {
            const data = await initData("lhs");
            lhsFieldArray.append({ data, selected: {} });
          };
          doAppend().catch(console.error);
        },
        onRemove: async (index) => {
          await updateData(index, "lhs", {});
          lhsFieldArray.remove(index);
        },
        onUpdate(index, selected) {
          lhsFieldArray.update(index, {
            selected,
            data: lhsFieldArray.fields[index].data,
          });
          updateData(index, "lhs", selected);
        },
      }}
      produces={{
        entries: rhsFieldArray.fields,
        onAppend() {
          const doAppend = async () => {
            const data = await initData("rhs");
            rhsFieldArray.append({ data, selected: {} });
          };
          doAppend().catch(console.error);
        },
        onRemove: async (index) => {
          await updateData(index, "rhs", {});
          rhsFieldArray.remove(index);
        },
        onUpdate(index, selected) {
          rhsFieldArray.update(index, {
            selected,
            data: rhsFieldArray.fields[index].data,
          });
          updateData(index, "rhs", selected);
        },
      }}
    />
  );
};

export default ScatteringCrossSectionsPage;
