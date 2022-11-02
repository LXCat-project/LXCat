import { NextPage } from "next";
import { StatefulReactionPicker } from "../../shared/StatefulReactionPicker";

interface Props {}

/* Strategy
 *
 * On state select update:
 *  - Detect which entry has been updated.
 *  - Compute new reactions and display new reactions (as this is immediately
 *  visible to the user).
 *  - Update the selection data of the other selection boxes.
 */

const ScatteringCrossSectionsPage: NextPage<Props> = () => {
  return (
    <StatefulReactionPicker
      onChange={function () {
        console.log(arguments);
      }}
      viewOnly={false}
    />
  );
};

export default ScatteringCrossSectionsPage;
