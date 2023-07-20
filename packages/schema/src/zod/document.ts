import { z } from "zod";
import { Reference } from "./common/reference";
import { AnyProcess } from "./process";
import { State } from "./state";

export const SelfReference = z.object({
  $schema: z.string().url(),
  url: z.string().url().describe("URL used to download this dataset."),
  termsOfUse: z.string().url().describe(
    "URL to the terms of use that have been accepted to download this dataset",
  ),
});

export const SetHeader = z.object({
  contributor: z.string().min(1),
  name: z.string().min(1),
  publishedIn: z.string().describe(
    "A key into the `references` dict. This is a reference to the paper that presents this dataset.",
  ).optional(),
  description: z.string().describe("A description of this dataset."),
});

// TODO: Add a `refine` that checks whether the referenced state and reference
//       keys actually exist in the respective objects.
const DocumentBody = z.object({
  references: z.record(Reference),
  states: z.record(State),
  processes: z.array(AnyProcess(z.string(), z.string())),
});

export const LTPDocument = SelfReference.merge(SetHeader).merge(DocumentBody);
