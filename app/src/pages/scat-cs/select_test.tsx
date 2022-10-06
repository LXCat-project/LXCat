import {
  getStateSelection,
  NestedStateArray,
} from "@lxcat/database/dist/cs/queries/public";
import { GetServerSideProps, NextPage } from "next";
import { StateSelect, StateSummary, StateTree } from "../../shared/StateSelect";

interface Props {
  nestedStates: Array<NestedStateArray>;
}

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

function stateArrayToTree(
  array?: Array<NestedStateArray>
): StateTree | undefined {
  return array ? Object.fromEntries(array.map(stateArrayToObject)) : undefined;
}

const ScatteringCrossSectionsPage: NextPage<Props> = ({ nestedStates }) => {
  console.log(nestedStates);
  console.log(stateArrayToTree(nestedStates));
  return <StateSelect data={stateArrayToTree(nestedStates) ?? {}} />;
};

export default ScatteringCrossSectionsPage;

export const getServerSideProps: GetServerSideProps<Props, {}> = async (
  _context
) => {
  return {
    props: { nestedStates: await getStateSelection([]) },
  };
};
