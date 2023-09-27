// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// https://npmjs.org/package/citation-js does not ship with Typescript declaration
// so define it minimally here

declare module "@citation-js/core" {
  import { Reference } from "@lxcat/schema";
  export declare interface InputOptions {
    forceType?: string;
    generateGraph?: boolean;
  }
  export declare interface OutputOptions {
    format?: "real";
    type?: string;
    style?: string;
    lang?: string;
  }
  export declare class Cite {
    constructor(csl: Reference | Array<Reference>, { forceType: string }?);
    format(
      format: string,
      { format: string, template: string }?,
    ): string | Record<string, string>;
    get(options?: OutputOptions): Array<Reference>;
    static async: (value: string, options?: InputOptions) => Promise<Cite>;
  }
}
