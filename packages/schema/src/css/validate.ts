import Ajv, { ErrorObject } from "ajv";
import { AnyAtom } from "../core/atoms";
import schema from "./CrossSectionSetRaw.schema.json";
import { CrossSectionSetRaw } from "./input";
import { get_states, check_states } from "./quantum_number_validator";

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

export const validateJSONSchema = ajv.compile<CrossSectionSetRaw>(schema);

class Validator {
  errors: ErrorObject[] | undefined | null = [];

  validate(data: unknown): data is CrossSectionSetRaw {
    const result = validateJSONSchema(data);
    this.errors = validateJSONSchema.errors;
    // TODO add other validators like
    // foreign labels or
    // particle state physics checks
    return result;
  }

  // must be called after validate(..)
  validate_quantum_numbers(data: CrossSectionSetRaw) {
    const states = get_states(data);
    if (this.errors == undefined) {
      this.errors = [];
    }
    // FIXME: doesn't return a status code, returns the error objects
    return check_states(states, this.errors);
  }
}

export const validator = new Validator();
