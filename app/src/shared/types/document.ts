import { CSL } from "./csl";
import { InState } from "./state";
import { Dict } from "./util";

export interface InputDocument<StateType, ProcessType> {
    contributor: string;
    name: string;
    // cite: Reference; // Should only be in output.
    // Disabled this field as its use is currently unclear.
    // publication?: Reference; // Should this field instead hold a key into 'references'?
    description: string;
    references: Dict<CSL.Data | string>;
    states: Dict<InState<StateType>>;
    processes: Array<ProcessType>;
  }
