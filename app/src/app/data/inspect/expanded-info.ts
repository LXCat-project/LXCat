// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { DenormalizedProcess } from "../denormalized-process";

/**
 * The details of a process shown when its table row is expanded: its
 * comments, the value of constant data, and the expression of expression
 * data. Undefined when there is nothing to expand.
 */
export type ExpandableInfo = {
  comments?: Array<string>;
  constant?: { value: number; unit: string };
  expression?: string;
};

export const expandableInfo = (
  info: DenormalizedProcess["info"],
): ExpandableInfo | undefined => {
  const comments = info.comments && info.comments.length > 0
    ? info.comments
    : undefined;
  const { data } = info;
  const constant = data.type === "Constant"
    ? { value: data.value, unit: data.unit }
    : undefined;
  const expression = data.type === "Expression" ? data.expression : undefined;
  if (
    comments === undefined && constant === undefined && expression === undefined
  ) {
    return undefined;
  }
  return { comments, constant, expression };
};
