// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Text } from "@mantine/core";
import type { ErrorObject } from "ajv";

export const ErrorList = ({ errors }: { errors: ErrorObject[] }) => {
  return (
    <Text c="red">
      <span>Error(s) during upload</span>
      <ul>
        {errors.map((e, i) => (
          <li key={i}>
            {e.message}, {e.params
              && Object.keys(e.params).length > 0
              && JSON.stringify(e.params, undefined, 2)}{" "}
            {e.instancePath && `@ ${e.instancePath}`}
          </li>
        ))}
      </ul>
    </Text>
  );
};
