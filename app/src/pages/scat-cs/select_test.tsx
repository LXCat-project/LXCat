import {
  getReactions,
  getStateSelection,
  NestedStateArray,
  StateProcess,
} from "@lxcat/database/dist/cs/queries/public";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ReactionPicker } from "../../shared/ReactionPicker";
import {
  StateSelection,
  StateSummary,
  StateTree,
} from "../../shared/StateSelect";

interface Props {}

export function stateArrayToObject(
  array: NestedStateArray
): [string, StateSummary] {
  return [
    array.id,
    {
      latex: array.latex,
      children: stateArrayToTree(array.children),
    },
  ];
}

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

export function stateArrayToTree(
  array?: Array<NestedStateArray>
): StateTree | undefined {
  return array ? Object.fromEntries(array.map(stateArrayToObject)) : undefined;
}

interface ListValues {
  entries: Array<StateEntryProps>;
}

const ScatteringCrossSectionsPage: NextPage<Props> = () => {
  const { control } = useForm<ListValues>();
  const lhsFieldArray = useFieldArray({ name: "entries", control });
  const rhsFieldArray = useFieldArray({ name: "entries", control });

  const [reactions, setReactions] = useState<Array<string>>([]);
  const [lhsSelected, setLhsSelected] = useState<Array<string>>([]);
  const [rhsSelected, setRhsSelected] = useState<Array<string>>([]);

  useEffect(() => {
    setLhsSelected(getSelectedStates(lhsFieldArray.fields));
    setRhsSelected(getSelectedStates(rhsFieldArray.fields));
  }, [lhsFieldArray.fields, rhsFieldArray.fields]);

  useEffect(() => {
    const updateReactions = async () => {
      // setReactions(await getReactions(lhsSelected, rhsSelected));
      await fetch(
        `/api/reactions?${new URLSearchParams({
          consumes: JSON.stringify(lhsSelected),
          produces: JSON.stringify(rhsSelected),
        })}`
      );
    };
    updateReactions().catch(console.error);
  }, [lhsSelected, rhsSelected]);

  // useEffect(() => {
  //   lhsFieldArray.fields.forEach(async (field, index) => {
  //     lhsFieldArray.update(index, {
  //       selected: field.selected,
  //       data:
  //         stateArrayToTree(
  //           await getStateSelection(StateProcess.Consumed, reactions)
  //         ) ?? {},
  //     });
  //   });
  //   rhsFieldArray.fields.forEach(async (field, index) => {
  //     rhsFieldArray.update(index, {
  //       selected: field.selected,
  //       data:
  //         stateArrayToTree(
  //           await getStateSelection(StateProcess.Produced, reactions)
  //         ) ?? {},
  //     });
  //   });
  // }, [reactions]);

  return (
    <ReactionPicker
      consumes={{
        entries: lhsFieldArray.fields,
        onAppend() {
          // TODO: Compute data.
          lhsFieldArray.append({ data: {}, selected: {} });
        },
        // TODO: Recompute data and reactions.
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
          rhsFieldArray.append({ data: {}, selected: {} });
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
