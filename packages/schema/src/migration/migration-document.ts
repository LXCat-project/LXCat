import { TypeOf } from "zod";
import { Reference } from "../common/reference.js";
import { AnySpecies } from "../species/any-species.js";
import { VersionedDocumentBody } from "../versioned-document.js";
import { DOIString } from "./doi-string.js";

export const LXCatMigrationDocument = VersionedDocumentBody(
  AnySpecies,
  Reference.or(DOIString),
);
export type LXCatMigrationDocument = TypeOf<typeof LXCatMigrationDocument>;
