import { Reference } from "../common/reference.js";
import { VersionedDocumentBody } from "../versioned-document.js";
import { DOIString } from "./doi-string.js";

export const LXCatMigrationDocument = VersionedDocumentBody(
  Reference.or(DOIString),
);
