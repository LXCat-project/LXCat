// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { err, ok, Result } from "true-myth/result";

/**
 * Serializable counterpart of a `true-myth` `Result`. Server actions can only
 * return plain data, so they return this and the client converts it back with
 * {@link toResult}.
 */
export type ActionResult<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const actionOk = <T, E = string>(value: T): ActionResult<T, E> => ({
  ok: true,
  value,
});

export const actionErr = <E = string>(error: E): ActionResult<never, E> => ({
  ok: false,
  error,
});

export const toResult = <T, E>(result: ActionResult<T, E>): Result<T, E> =>
  result.ok ? ok(result.value) : err(result.error);
