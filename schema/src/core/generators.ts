import { NOT } from "./util";

/**
 * Generic implementation interface for unspecified state components.
 * @template K The name of the property storing the unspecified state component's string identifier.
 */
type UTImpl<K extends string> = {
  [key in K]: string;
};

/**
 * Generic interface for unspecified state components. Forbids the definition of any properties declared in `MT`, except for the property specified by `K`.
 * @template K The key name of the property storing the unspecified state component's string identifier.
 * @template MT The state component type.
 */
type UT<K extends string, MT> = NOT<Exclude<keyof MT, K>> & UTImpl<K>;

// Atoms
/**
 * The undefined state component type for atoms.
 * @template E The state component type.
 */
export type UAtomic<E> = UT<"e", E>;

/**
 * Helper type to define a property `type` with value `T`.
 * @template T The string value that is assigned to the `type` key.
 */
export interface TypeString<T extends string> {
  type: T;
}

/**
 * Helper type for defining an array with minimum size one.
 * @template T The type of the array elements.
 */
type ArrayMinOne<T> = [T, ...Array<T>];

/**
 * Generic atomic generator type, generates the correct structure for atomic types.
 * @template E Type of the electronic component.
 * @template AT Additional types to add onto each component level.
 * @template SE The name of the property storing the top level of (electronic) components.
 */
export type AtomicGenericGenerator<
  E,
  AT = Record<string, unknown>,
  SE extends string = "electronic"
> = {
  [key in SE]: ArrayMinOne<AT & (UAtomic<E> | E)>;
};

// Generators to be used for input types.
/**
 * Atomic generator type used to generate the correct structure of atomic state types on input.
 * @template E Type of the electronic component.
 * @template A The string identifier of the generated atomic type.
 */
export type AtomicGenerator<E, A extends string> = TypeString<A> &
  AtomicGenericGenerator<E>;

// Molecules
/**
 * The undefined electronic state component for molecules.
 * @template E The electronic state component type.
 * @template CK The key name of the property storing vibrational child components of the electronic component.
 */
export type UE<E, CK extends string> = UT<"e", E> & NOT<CK>;

/**
 * The undefined vibrational state component for molecules.
 * @template V The vibrational state component type.
 * @template CK The key name of the property storing rotational child components of the vibrational component.
 */
export type UV<V, CK extends string> = UT<"v", V> & NOT<CK>;

/**
 * The undefined rotational state component for molecules.
 * @template R The rotational state component type.
 */
export type UR<R> = UT<"J", R>;

/**
 * Helper type to define the property that stores substate (child) components. Note that this property is optional, but when it is present, it requires at least one entry.
 * @template T The type of the substate components.
 * @template K The key name of the property that stores the substate components.
 */
type Children<T, K extends string> = {
  [key in K]?: ArrayMinOne<T>;
};

/**
 * Generic molecular generator type, generates the correct object structure for molecular types.
 * @template E Type of the electronic component.
 * @template V Type of the vibrational component.
 * @template R Type of the rotational component.
 * @template AT Additional types to add onto each component level.
 * @template SE The name of the property storing the top level of (electronic) components.
 * @template SV The name of the property storing the second level of (vibrational) components.
 * @template SR The name of the property storing the third level of (rotational) components.
 */
type MolecularGenericGenerator<
  E,
  V,
  R,
  AT = Record<string, unknown>,
  SE extends string = "electronic",
  SV extends string = "vibrational",
  SR extends string = "rotational"
> = {
  [key in SE]: ArrayMinOne<
    AT &
      (
        | UE<E, SV>
        | (E &
            Children<
              AT & (UV<V, SR> | (V & Children<AT & (UR<R> | R), SR>)),
              SV
            >)
      )
  >;
};

/**
 * Molecular generator type used to generate the correct structure of molecular state types on input.
 * @template E Type of the electronic component.
 * @template V Type of the vibrational component.
 * @template R Type of the rotational component.
 * @template M The string identifier of the generated molecular type.
 */
export type MolecularGenerator<E, V, R, M extends string> = TypeString<M> &
  MolecularGenericGenerator<E, V, R>;

/**
 * Helper type that defines a `summary` property that is used to store a string summary of a state component.
 */
interface LevelSummary {
  summary: string;
}

// Generators to be used for output types.
/**
 * Atomic generator type used to generate the correct structure of atomic state types on output. The difference between this type and [[AtomicGenerator]] is that each component entry now includes a `summary` field as stated in [[LevelSummary]].
 * @template E Type of the electronic component.
 * @template A The string identifier of the generated atomic type.
 */
export type AtomicDBGenerator<E, A extends string> = TypeString<A> &
  AtomicGenericGenerator<E, LevelSummary>;

/**
 * Molecular generator type used to generate the correct structure of molecular state types on output. The difference between this type and [[MolecularGenerator]] is that each component entry now includes a `summary` field as stated in [[LevelSummary]].
 * @template E Type of the electronic component.
 * @template V Type of the vibrational component.
 * @template R Type of the rotational component.
 * @template M The string identifier of the generated molecular type.
 */
export type MolecularDBGenerator<E, V, R, M extends string> = TypeString<M> &
  MolecularGenericGenerator<E, V, R, LevelSummary>;
