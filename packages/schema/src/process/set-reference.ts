import { array, object, string } from "zod";

export const SetReference = object({
  isPartOf: array(string()),
});
