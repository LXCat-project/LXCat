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

const ScatteringCrossSectionsPage: NextPage<Props> = () => {
  const { control } = useForm<ListValues>();
  const lhsFieldArray = useFieldArray({ name: "lhs", control });
  const rhsFieldArray = useFieldArray({ name: "rhs", control });

  const [reactions, setReactions] = useState<Array<string>>([]);
  const [lhsSelected, setLhsSelected] = useState<Array<string>>([]);
  const [rhsSelected, setRhsSelected] = useState<Array<string>>([]);

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
  }, [lhsFieldArray.fields, rhsFieldArray.fields]);

  useEffect(() => {
    const updateReactions = async () => {
      const response = await fetch(
        `/api/reactions?${new URLSearchParams({
          consumes: JSON.stringify(lhsSelected),
          produces: JSON.stringify(rhsSelected),
        })}`
      );
      const reactions = await response.json();
      console.log(reactions);
      setReactions(reactions);
    };
    updateReactions().catch(console.error);
  }, [lhsSelected, rhsSelected]);

  useEffect(() => {
    const updateLhs = async () => {
      const response = await fetch(
        `/api/states/in_reaction?${new URLSearchParams({
          stateProcess: StateProcess.Consumed,
          reactions: JSON.stringify(reactions),
        })}`
      );
      const data = await response.json();
      lhsFieldArray.fields.forEach(async (field, index) => {
        lhsFieldArray.update(index, {
          selected: field.selected,
          data,
        });
      });
    };
    const updateRhs = async () => {
      const response = await fetch(
        `/api/states/in_reaction?${new URLSearchParams({
          stateProcess: StateProcess.Produced,
          reactions: JSON.stringify(reactions),
        })}`
      );
      const data = await response.json();
      rhsFieldArray.fields.forEach(async (field, index) => {
        rhsFieldArray.update(index, {
          selected: field.selected,
          data,
        });
      });
    };

    updateLhs().catch(console.error);
    updateRhs().catch(console.error);
  }, [reactions]);

  return (
    <ReactionPicker
      consumes={{
        entries: lhsFieldArray.fields,
        onAppend() {
          const doAppend = async () => {
            const response = await fetch(
              `/api/states/in_reaction?${new URLSearchParams({
                stateProcess: StateProcess.Consumed,
                reactions: JSON.stringify(reactions),
              })}`
            );
            const data = await response.json();
            lhsFieldArray.append({ data, selected: {} });
          };
          doAppend().catch(console.error);
        },
        onRemove: lhsFieldArray.remove,
        onUpdate(index, selected) {
          lhsFieldArray.update(index, {
            selected,
            data: lhsFieldArray.fields[index].data,
          });
        },
      }}
      produces={{
        entries: rhsFieldArray.fields,
        onAppend() {
          const doAppend = async () => {
            const response = await fetch(
              `/api/states/in_reaction?${new URLSearchParams({
                stateProcess: StateProcess.Produced,
                reactions: JSON.stringify(reactions),
              })}`
            );
            const data = await response.json();
            rhsFieldArray.append({ data, selected: {} });
          };
          doAppend().catch(console.error);
        },
        onRemove: rhsFieldArray.remove,
        onUpdate(index, selected) {
          rhsFieldArray.update(index, {
            selected,
            data: rhsFieldArray.fields[index].data,
          });
        },
      }}
    />
  );
};

export default ScatteringCrossSectionsPage;
