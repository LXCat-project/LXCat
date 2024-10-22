// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Represents the path to a specific state in a hierarchical structure.
 */
export interface StatePath {
  particle?: string;
  electronic?: string;
  vibrational?: string;
  rotational?: string;
}

/**
 * Represents a leaf node in the state hierarchy.
 */
export interface StateLeaf {
  id: string;
  includeChildren: boolean;
}

export const OMIT_CHILDREN_KEY = "omit_children";

/**
 * Retrieves the leaf node of a state hierarchy based on the provided state path.
 *
 * @param {StatePath} param0 - The state path containing particle, electronic, vibrational, and rotational states.
 * @returns {StateLeaf | undefined} - The leaf node of the state hierarchy or undefined if the particle is not provided.
 */
export const getStateLeaf = ({
  particle,
  electronic,
  vibrational,
  rotational,
}: StatePath): StateLeaf | undefined => {
  if (!particle) return undefined;

  if (!electronic) return { id: particle, includeChildren: true };

  if (electronic === OMIT_CHILDREN_KEY) {
    return { id: particle, includeChildren: false };
  }

  if (!vibrational) return { id: electronic, includeChildren: true };

  if (vibrational === OMIT_CHILDREN_KEY) {
    return { id: electronic, includeChildren: false };
  }

  if (!rotational) return { id: vibrational, includeChildren: true };

  if (rotational === OMIT_CHILDREN_KEY) {
    return { id: vibrational, includeChildren: false };
  }

  return { id: rotational, includeChildren: false };
};

/**
 * Extracts state leafs from an array of state paths.
 *
 * @param entries - An array of StatePath objects to process.
 * @returns An array of StateLeaf objects extracted from the input entries.
 */
export const getStateLeafs = (entries: Array<StatePath>): Array<StateLeaf> =>
  entries.map(getStateLeaf).filter((id): id is StateLeaf => id !== undefined);
