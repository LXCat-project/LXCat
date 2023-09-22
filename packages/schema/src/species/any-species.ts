// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, output } from "zod";
import { AnyAtom, AnyAtomSerializable } from "./atoms/any-atom";
import { serializeAtom } from "./atoms/serialize";
import { isSerializableAtom } from "./atoms/type-guard";
import { AnyParticle } from "./composition/any-particle";
import { serializeSimpleParticle } from "./composition/simple/serialize";
import { AnyMolecule, AnyMoleculeSerializable } from "./molecules";
import { serializeMolecule } from "./molecules/serialize";
import { isSerializableMolecule } from "./molecules/type-guard";
import { StateSummary } from "./summary";
import { serializeUnspecified, Unspecified } from "./unspecified";

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
