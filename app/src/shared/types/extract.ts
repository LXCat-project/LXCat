import { MolecularGenerator, AtomicGenerator } from "./generators";
import { State } from "./state";

export type ExtractE<
  M extends MolecularGenerator<any, any, any, string>
> = M extends MolecularGenerator<infer E, any, any, any> ? E : never;
export type ExtractV<
  M extends MolecularGenerator<any, any, any, string>
> = M extends MolecularGenerator<any, infer V, any, string> ? V : never;
export type ExtractR<
  M extends MolecularGenerator<any, any, any, string>
> = M extends MolecularGenerator<any, any, infer R, string> ? R : never;

export type ExtractAtomic<
  A extends AtomicGenerator<any, string>
> = A extends AtomicGenerator<infer E, string> ? E : never;

export type ExtractGenerator<S extends State<any>> = S extends State<infer G>
  ? G
  : never;
