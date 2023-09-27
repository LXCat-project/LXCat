import { boolean, object, string, TypeOf } from "zod";

export const SetHeader = object({
  contributor: string().min(1),
  name: string().min(1),
  publishedIn: string().describe(
    "A key into the `references` dict. This is a reference to the paper that presents this dataset.",
  ).optional(),
  description: string().describe("A description of this dataset."),
  complete: boolean(),
});
export type SetHeader = TypeOf<typeof SetHeader>;
