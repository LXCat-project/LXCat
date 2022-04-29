// https://npmjs.org/package/citation-js does not ship with Typescript declaration
// so define it minimally here

declare module 'citation-js' {
    declare class Cite {
        constructor(csl: any);
        format(format: string): string
    }
    export default Cite
}