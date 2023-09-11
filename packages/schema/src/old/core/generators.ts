// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Helper type that defines a `summary` property that is used to store a string
 * summary of a state component.
 */
export interface LevelSummary {
  summary: string;
}

/**
 * Helper type that defines a `latex` property that is used to store a latex
 * representation of a state component.
 */
export interface LatexString {
  latex: string;
}

/**
 * @internal
 */
type RootComponent<Component, SubComponent, SubKey extends string> =
  | (Component & { [key in SubKey]?: SubComponent })
  | Array<Component>;

/**
 * @internal
 */
type SubComponent<Component, SubComponent, SubKey extends string> =
  | string
  | RootComponent<Component | string, SubComponent, SubKey>;

/**
 * @internal
 */
type LeafComponent<Component> = string | Component | Array<Component | string>;

/**
 * @internal
 */
export type TypeTag<Tag extends string> = { type: Tag };

/**
 * @internal
 */
export type Molecule<Tag extends string, Electronic, Vibrational, Rotational> =
  & TypeTag<Tag>
  & {
    electronic: RootComponent<
      Electronic,
      SubComponent<
        Vibrational,
        LeafComponent<Rotational>,
        "rotational"
      >,
      "vibrational"
    >;
  };

/**
 * @internal
 */
export type Atom<Tag extends string, Electronic> =
  & TypeTag<Tag>
  & { electronic: Electronic | Array<Electronic> };

export type UnknownMolecule = Molecule<string, unknown, unknown, unknown>;

export type UnknownAtom = Atom<string, unknown>;

export type TransformAtom<A extends UnknownAtom> = A extends
  Atom<infer S, infer E> ? Atom<S, E & LevelSummary & LatexString> : never;

export type TransformMolecule<M extends UnknownMolecule> = M extends
  Molecule<infer S, infer E, infer V, infer R> ? Molecule<
    S,
    E & LevelSummary & LatexString,
    V & LevelSummary & LatexString,
    R & LevelSummary & LatexString
  >
  : never;
