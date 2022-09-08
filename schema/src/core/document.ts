import { Reference } from "./reference";
import { InState } from "./state";
import { Dict } from "./util";

export interface InputDocument<StateType, ProcessType> {
  /**
   * @minLength 1
   */
  contributor: string;
  /**
   * @minLength 1
   */
  name: string;
  // cite: Reference; // Should only be in output.
  // Disabled this field as its use is currently unclear.
  // publication?: Reference; // Should this field instead hold a key into 'references'?
  description: string;
  // TODO for validation the keys should be unique and the values as well
  references: Dict<Reference>;
  // TODO for validation the keys should be unique and the values as well
  states: Dict<InState<StateType>>;
  /**
   * @minItems 1
   * @uniqueItems true
   */
  processes: Array<ProcessType>;
}
