import { z } from "zod";

export const ReactionTypeTag = z.enum([
  "Elastic",
  "Effective",
  "Electronic",
  "Vibrational",
  "Rotational",
  "Attachment",
  "Ionization",
]);
