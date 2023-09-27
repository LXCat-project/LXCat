import { Reference, SetHeader } from "@lxcat/schema";
import { AnySpecies } from "@lxcat/schema/species";
import { array, object, output, record, string } from "zod";

import { Process, ProcessInfo } from "@lxcat/schema/process";
import { Keyed, PartialKeyed } from "./key";
import { KeyedProcess } from "./process";

const KeyedDocumentBody = object({
  references: record(Reference),
  states: record(AnySpecies),
  processes: array(KeyedProcess(string(), string())),
});

export const KeyedDocument = Keyed(SetHeader.merge(KeyedDocumentBody));
export type KeyedDocument = output<typeof KeyedDocument>;

const PartialKeyedDocumentBody = object({
  references: record(Reference),
  states: record(AnySpecies),
  processes: array(Process(string(), PartialKeyed(ProcessInfo(string())))),
});

export const PartialKeyedDocument = PartialKeyed(
  SetHeader.merge(PartialKeyedDocumentBody),
);
export type PartialKeyedDocument = output<typeof PartialKeyedDocument>;
