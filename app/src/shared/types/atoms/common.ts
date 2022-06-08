import { ShellEntry } from "../shell_entry";
import { CouplingScheme } from "./coupling_scheme";

export interface TotalAngularSpecifier {
  J: number;
}

export interface ConfigTerm<
  S extends CouplingScheme,
  T,
  C = Array<ShellEntry>
> {
  scheme: S;
  config: C;
  term: T;
}

export interface TwoTermConfig<C, E> {
  core: C;
  excited: E;
}
