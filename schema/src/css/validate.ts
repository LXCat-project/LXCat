import Ajv from "ajv";
import schema from "../../dist/schemas/CrossSectionSet.schema.json";

const ajv = new Ajv({ allErrors: true });

export const validate = ajv.compile(schema);
