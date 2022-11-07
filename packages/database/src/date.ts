// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 *
 * @returns Current date time as ISO8601 formatted string
 */
export function now(): string {
  const d = new Date();
  return d.toISOString();
}
