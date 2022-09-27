import Ajv, { ErrorObject } from "ajv";
import schema from "./CrossSectionSetRaw.schema.json";
import { CrossSectionSetRaw } from "./input";

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

  validateLookups(data: CrossSectionSetRaw) {
    const errors: ErrorObject[] = []
    const remoteStateLabels = new Set(Object.keys(data.states))
    data.processes.forEach((process, pid) => {
      process.reaction.lhs.forEach((entry, eid) => {
        if (!remoteStateLabels.has(entry.state)) {
          errors.push({
            keyword: 'lookup',
            instancePath: `processes/${pid}/reaction/lhs/${eid}`,
            params: {
              state: entry.state
            },
            schemaPath: '',
            message: `State with label ${entry.state} not found.`
          })
        }
      })
    })
    return errors
  }
}

export const validator = new Validator();
