// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, globalRegistry, output } from "zod";
import { AnyAtom, AnyAtomSerializable } from "./atoms/any-atom.js";
import { serializeAtom } from "./atoms/serialize.js";
import { isSerializableAtom } from "./atoms/type-guard.js";
import {
  AnyMolecule,
  AnyMoleculeSerializable,
} from "./molecules/any-molecule.js";
import { serializeMolecule } from "./molecules/serialize.js";
import { isSerializableMolecule } from "./molecules/type-guard.js";
import { Electron } from "./particles/electron.js";
import { serializeSimpleParticle } from "./particles/serialize.js";
import { StateSummary } from "./summary.js";
import { serializeUnspecified, Unspecified } from "./unspecified/index.js";

export const AnySpecies = discriminatedUnion([
  Electron,
  ...AnyAtom.def.options,
  ...AnyMolecule.def.options,
  Unspecified,
]);
export type AnySpecies = output<typeof AnySpecies>;

globalRegistry.add(AnySpecies, { id: "AnySpecies" });

export const AnySpeciesSerializable = discriminatedUnion("type", [
  Electron,
  ...AnyAtomSerializable.def.options,
  ...AnyMoleculeSerializable.def.options,
  Unspecified,
])
  .transform(
    (state) => ({
      ...state,
      serialize: (): StateSummary => {
        if (state.type === "Unspecified") {
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
