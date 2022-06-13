import Ajv, { ErrorObject } from "ajv";
import schema from "./CrossSectionSet.schema.json";
import { CrossSectionSetInput } from "./input";

const ajv = new Ajv({ allErrors: true });

export const validateJSONSchema = ajv.compile<CrossSectionSetInput>(schema);

class Validator {
    errors: ErrorObject[] | undefined | null = []

    validate(data: unknown): data is CrossSectionSetInput {
        const result = validateJSONSchema(data)
        this.errors = validateJSONSchema.errors
        // TODO add other validators like
        // foreign labels or 
        // particle state physics checks
        return result
    }
}

export const validator = new Validator()
