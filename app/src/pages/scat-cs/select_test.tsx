import { NextPage } from "next";
import { StatefulReactionPicker } from "../../shared/StatefulReactionPicker";

interface Props {}

const ScatteringCrossSectionsPage: NextPage<Props> = () => {
  return (
    <StatefulReactionPicker
      onChange={function () {
        console.log(arguments);
      }}
    />
  );
};

export default ScatteringCrossSectionsPage;
