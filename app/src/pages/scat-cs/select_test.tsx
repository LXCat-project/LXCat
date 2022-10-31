import { NextPage } from "next";
import { StatefulReactionPicker } from "../../shared/StatefulReactionPicker";

interface Props {};

const ScatteringCrossSectionsPage: NextPage<Props> = () => {

  return (
    <StatefulReactionPicker onChange={(reactions) => console.log(reactions)} />
  );
};

export default ScatteringCrossSectionsPage;
