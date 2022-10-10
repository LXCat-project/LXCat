import { Fragment } from "react";
import { StateListStatic, StateListStaticProps } from "./StateList";

interface ReactionPickerProps {
  consumes: StateListStaticProps;
  produces: StateListStaticProps;
}

export const ReactionPicker = ({ consumes, produces }: ReactionPickerProps) => {
  return (
    // TODO: Properly group components.
    <Fragment>
      <StateListStatic {...consumes} />
      <StateListStatic {...produces} />
    </Fragment>
  );
};
