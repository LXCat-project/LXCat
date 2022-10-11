import { Fragment } from "react";
import { StateList, StateListProps } from "./StateList";

interface ReactionPickerProps {
  consumes: StateListProps;
  produces: StateListProps;
}

export const ReactionPicker = ({ consumes, produces }: ReactionPickerProps) => {
  return (
    // TODO: Properly group components.
    <Fragment>
      <StateList {...consumes} />
      <StateList {...produces} />
    </Fragment>
  );
};
