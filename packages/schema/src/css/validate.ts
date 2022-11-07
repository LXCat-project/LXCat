// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: Apache-2.0

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
}

export const validator = new Validator();
