import { Reference, SetHeader } from "@lxcat/schema";
import { AnySpecies } from "@lxcat/schema/species";
import { array, object, output, record, string } from "zod";

import { Keyed } from "./key";
import { KeyedProcess } from "./process";

const KeyedDocumentBody = object({
  references: record(Reference),
  states: record(AnySpecies),
  processes: array(KeyedProcess(string(), string())),
});

export const KeyedDocument = Keyed(SetHeader.merge(KeyedDocumentBody));
export type KeyedDocument = output<typeof KeyedDocument>;
