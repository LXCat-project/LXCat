import { CSParameters } from "../types";
import { CSStorage } from "./data_types";

export type CrossSection = {
  reaction: string;
  parameters?: CSParameters;
  threshold: number;
} & CSStorage;

export interface CrossSectionSet {
  name: string;
  description: string;
  complete: boolean;
}
