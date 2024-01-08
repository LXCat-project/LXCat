// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, output } from "zod";
import { AnyAtom, AnyAtomSerializable } from "./atoms/any-atom.js";
import { serializeAtom } from "./atoms/serialize.js";
import { isSerializableAtom } from "./atoms/type-guard.js";
import { AnyParticle } from "./composition/any-particle.js";
import { serializeSimpleParticle } from "./composition/simple/serialize.js";
import {
  AnyMolecule,
  AnyMoleculeSerializable,
} from "./molecules/any-molecule.js";
import { serializeMolecule } from "./molecules/serialize.js";
import { isSerializableMolecule } from "./molecules/type-guard.js";
import { StateSummary } from "./summary.js";
import { serializeUnspecified, Unspecified } from "./unspecified/index.js";

export const AnySpecies = discriminatedUnion("type", [
  AnyParticle,
  ...AnyAtom.options,
  ...AnyMolecule.options,
  Unspecified,
]);
export type AnySpecies = output<typeof AnySpecies>;

export const AnySpeciesSerializable = discriminatedUnion("type", [
  AnyParticle,
  ...AnyAtomSerializable.options,
  ...AnyMoleculeSerializable.options,
  Unspecified,
])
  .transform(
    (state) => ({
      ...state,
      serialize: (): StateSummary => {
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

export type AnySpeciesSerializable = output<typeof AnySpecies>;
