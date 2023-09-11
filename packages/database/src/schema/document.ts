import { Reference } from "@lxcat/schema/dist/common/reference";
import { SetHeader } from "@lxcat/schema/dist/document";
import { State } from "@lxcat/schema/dist/state";
import { array, object, output, record, string } from "zod";

import { Keyed } from "./key";
import { KeyedProcess } from "./process";

const KeyedDocumentBody = object({
  references: record(Reference),
  states: record(State),
  processes: array(KeyedProcess(string(), string())),
});

export const KeyedDocument = Keyed(SetHeader.merge(KeyedDocumentBody));
export type KeyedDocument = output<typeof KeyedDocument>;
