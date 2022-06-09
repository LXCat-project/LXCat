import { MolecularGenerator, AtomicGenerator } from "./generators";
import { State } from "./state";

export type ExtractE<
  M extends MolecularGenerator<unknown, unknown, unknown, string>
> = M extends MolecularGenerator<infer E, unknown, unknown, string> ? E : never;
export type ExtractV<
  M extends MolecularGenerator<unknown, unknown, unknown, string>
> = M extends MolecularGenerator<unknown, infer V, unknown, string> ? V : never;
export type ExtractR<
  M extends MolecularGenerator<unknown, unknown, unknown, string>
> = M extends MolecularGenerator<unknown, unknown, infer R, string> ? R : never;

export type ExtractAtomic<A extends AtomicGenerator<unknown, string>> =
  A extends AtomicGenerator<infer E, string> ? E : never;

export type ExtractGenerator<S extends State<unknown>> = S extends State<
  infer G
>
  ? G
  : never;
