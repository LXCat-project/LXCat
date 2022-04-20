import { NOT } from "./util";

export interface SimpleParticle {
  particle: string;
  charge: number;
}

// DONE: For some reason, adding the 'electronic' property without specifying a
// type is allowed by the compiler.  This should not be allowed. The strange
// thing is that the generated JSON schema IS correct (either both 'type' and
// 'electronic' are specified or neither).
// Solved by switching to T | NOT<T>.
// See issue: https://github.com/vega/ts-json-schema-generator/issues/348
export type State<T> = SimpleParticle & (T | NOT<keyof T>);

export type InState<T> = State<T>;

interface DBIdentifier {
  id: string;
}

export type DBState<StateType> = DBIdentifier & State<StateType>;