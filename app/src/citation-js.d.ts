// https://npmjs.org/package/citation-js does not ship with Typescript declaration
// so define it minimally here


declare module "citation-js" {
  import { Reference } from "@lxcat/schema/dist/core/reference";
  declare class Cite {
    constructor(csl: Reference, {
      forceType: string
    }?);
    format(format: string, {
      format: string,
      template: string
    }?): string | Record<string, string>;
    static async inputAsync: (value: string, {
      forceType: string
    }?) => Promise<Reference[]>
  }
  export default Cite;
}
