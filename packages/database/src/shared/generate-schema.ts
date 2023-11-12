// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from "fs/promises";
import { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const generateSchema = async <Type extends ZodTypeAny>(
  Type: Type,
  file: string,
) => {
  const schema = zodToJsonSchema(Type, { $refStrategy: "none" });
  return fs.writeFile(file, JSON.stringify(schema));
};
