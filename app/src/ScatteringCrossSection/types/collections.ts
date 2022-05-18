import { CSParameters } from "../types";
import { CSStorage } from "./data_types";

export type CrossSection = {
  reaction: string;
  parameters?: CSParameters;
  threshold: number;
} & CSStorage;
