// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { FormErrors } from "@mantine/form";
import { ZodType } from "zod";

// NOTE: Taken from https://github.com/mantinedev/mantine-form-zod-resolver/blob/master/src/zod-resolver.ts.
//       Updated to work with zod 4.
export function zodResolver(
  schema: ZodType,
  options?: { errorPriority?: "first" | "last" },
) {
  return (values: Record<string, unknown>): FormErrors => {
    const parsed = schema.safeParse(values);

    if (parsed.success) {
      return {};
    }

    const results: FormErrors = {};

    if ("error" in parsed) {
      if (options?.errorPriority === "first") {
        parsed.error.issues.reverse();
      }
      parsed.error.issues.forEach((error) => {
        results[error.path.join(".")] = error.message;
      });
    }

    return results;
  };
}
