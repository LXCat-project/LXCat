import { object, output, string } from "zod";

export const SelfReference = object({
  $schema: string().url(),
  url: string().url().describe("URL used to download this dataset."),
  termsOfUse: string().url().describe(
    "URL to the terms of use that have been accepted to download this dataset",
  ),
});
export type SelfReference = output<typeof SelfReference>;
