// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { serializeAtom } from "./atoms/serialize";
import { isSerializableAtom } from "./atoms/type-guard";
import { serializeSimpleParticle } from "./composition/simple/serialize";
import { serializeMolecule } from "./molecules/serialize";
import { isSerializableMolecule } from "./molecules/type-guard";
import { AnySpeciesSerializable } from "./species";
import { serializeUnspecified } from "./unspecified/serialize";

export const State = AnySpeciesSerializable.transform(
  (state) => ({
    ...state,
    serialize: () => {
      if (state.type === "unspecified") {
        return serializeUnspecified(state);
      } else if (isSerializableAtom(state)) {
        return serializeAtom(state);
      } else if (isSerializableMolecule(state)) {
        return serializeMolecule(state);
      }

      return serializeSimpleParticle(state);
    },
  }),
);
export type State = z.input<typeof State>;
export type SerializableState = z.output<typeof State>;

const stripFunctionsRecursive = (obj: any): any => {
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "function") {
        delete obj[key];
      } else if (typeof value === "object") {
        obj[key] = stripFunctionsRecursive(obj[key]);
      }
    }
  }

  return obj;
};
