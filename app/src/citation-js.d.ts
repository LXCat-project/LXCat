// https://npmjs.org/package/citation-js does not ship with Typescript declaration
// so define it minimally here

declare module "@citation-js/core" {
  import { Reference } from "@lxcat/schema/dist/core/reference";
  export declare class Cite {
    constructor(csl: Reference, { forceType: string }?);
    format(
      format: string,
      { format: string, template: string }?
    ): string | Record<string, string>;
    static inputAsync: (
      value: string,
      { forceType: string }?
    ) => Promise<Reference[]>;
  }
}
