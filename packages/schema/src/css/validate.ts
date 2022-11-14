// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import Ajv, { ErrorObject } from "ajv";
import schema from "./CrossSectionSetRaw.schema.json";
import { CrossSectionSetRaw } from "./input";
import { getStates, checkStates } from "./quantum_number_validator";

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

export const validateJSONSchema = ajv.compile<CrossSectionSetRaw>(schema);

export class Validator {
  errors: ErrorObject[] | undefined | null = [];

  validate(data: unknown): data is CrossSectionSetRaw {
    const result = validateJSONSchema(data);
    this.errors = validateJSONSchema.errors;
    if (result) {
      this.validateQuantumNumbers(data);
      return this.errors?.length === 0;
    }
    // TODO add other validators like
    // foreign labels
    return result;
  }

  validateQuantumNumbers(data: CrossSectionSetRaw) {
    const states = getStates(data);
    if (this.errors == undefined) {
      this.errors = [];
    }
    return checkStates(states, this.errors);
  }
}

export const validator = new Validator();
