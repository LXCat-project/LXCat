// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SetOperationResult } from "@/author/set-operations";
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  okJsonResponse,
} from "@/shared/api/api-responses";

/** Convert the result of a set operation to an API response. */
export const operationResponse = <T>(result: SetOperationResult<T>) => {
  if (result.isOk) {
    return okJsonResponse(result.value);
  }
  const { status, ...content } = result.error;
  switch (status) {
    case 400:
      return badRequestResponse(content);
    case 403:
      return forbiddenResponse(content);
    case 404:
      return notFoundResponse(content);
  }
};
