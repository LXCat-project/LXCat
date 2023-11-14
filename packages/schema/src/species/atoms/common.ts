// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { electronicOrbital } from "../common";

/**
 * Array used for the conversion of the orbital angular momentum
 * quantum L to its alphabetic representation.
 */
export const atomicOrbital = ["S", "P", "D", "F", "G", "H"] as const;

/// Zod helper types

/**
 * Zod type that represents the total angular momentum quantum J.
 */
export const TotalAngularSpecifier = z.object({
  J: z.number().multipleOf(0.5).nonnegative(),
});

/**
 * @typeParam EConfig - A zod type representing the atomic electron
 *            configuration.
 * @typeParam Symbol - A zod type type representing the term symbol of the
 *            atomic configuration.
 * @returns A zod object representing an atomic state configuration.
 */
export const buildTerm = <
  EConfig extends z.ZodTypeAny,
  TermSymbol extends z.ZodTypeAny,
>(electronConfig: EConfig, term: TermSymbol) =>
  z.object({ config: electronConfig, term });

/**
 * @typeParam Core - A zod type representing an atomic configuration for the
 *            core electrons.
 * @typeParam Excited - A zod type representing an atomic configuration for the
 *            excited electrons.
 * @returns A zod object representing an atomic state configuration with
 *          separate configurations for the core and excited electrons (used in
 *          e.g. LS1 and J1L2 coupling).
 */
export const buildTwoTerm = <
  Core extends z.ZodTypeAny,
  Excited extends z.ZodTypeAny,
>(core: Core, excited: Excited) => z.object({ core, excited });

export const ShellEntry = z.object({
  n: z.number().int().min(1),
  l: z.number().int().nonnegative(),
  occupance: z.number().int().nonnegative(),
});
export type ShellEntry = z.infer<typeof ShellEntry>;

/// Serializer functions

export const serializeShellEntry = (entry: ShellEntry) => {
  if (entry.occupance == 0) {
    return "";
  }

  return `${entry.n}${electronicOrbital[entry.l]}${
    entry.occupance > 1 ? `^{${entry.occupance}}` : ""
  }`;
};

export function serializeShellConfig(config: Array<ShellEntry>): string {
  return config.reduce(
    (total, entry) => total + serializeShellEntry(entry),
    "",
  );
}

export function serializeHalfInteger(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  if (Number.isInteger(n * 2)) return `${n * 2}/2`;

  throw new Error(`Number ${n} is not an integer or a half integer.`);
}
