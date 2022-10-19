import { StateList, StateListProps } from "./StateList";

interface ReactionPickerProps {
  consumes: StateListProps;
  produces: StateListProps;
}

export const ReactionPicker = ({ consumes, produces }: ReactionPickerProps) => {
  return (
    // TODO: Properly group components.
    <>
      <StateList {...consumes} />
      <StateList {...produces} />
    </>
  );
};
