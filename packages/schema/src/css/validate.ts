import Ajv, { ErrorObject } from "ajv";
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
    if (result) {
      this.validate_quantum_numbers(data);
      return this.errors?.length === 0;
    }
    // TODO add other validators like
    // foreign labels or
    return result;
  }

  // must be called after validate(..)
  validate_quantum_numbers(data: CrossSectionSetRaw) {
    const states = get_states(data);
    if (this.errors == undefined) {
      this.errors = [];
    }
    return check_states(states, this.errors);
  }
}

export const validator = new Validator();
