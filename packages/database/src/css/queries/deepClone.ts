// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export function deepClone<T>(i: T): T {
  return JSON.parse(JSON.stringify(i));
}
