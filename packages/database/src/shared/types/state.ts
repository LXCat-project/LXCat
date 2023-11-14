export type StateSummary = {
  latex: string;
  valid: boolean;
  children?: StateTree;
};
export type StateTree = Record<string, StateSummary>;
