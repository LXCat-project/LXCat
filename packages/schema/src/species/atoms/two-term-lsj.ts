// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, output } from "zod";
import { registerType } from "../../common/util.js";
import { makeComponent } from "../component.js";
import { AtomComposition } from "../composition/atom.js";
import { SpeciesBase } from "../composition/species-base.js";
import { makeAtom } from "../generators.js";
import {
  buildTerm,
  buildTwoTerm,
  serializeShellConfig,
  ShellEntry,
} from "./common.js";
import { LSDescriptor, serializeLatexLSTerm, serializeLSTerm } from "./ls.js";
import { LSJTerm, serializeLatexLSJTerm, serializeLSJTerm } from "./lsj.js";

const TwoTermLSJDescriptor = buildTerm(
  buildTwoTerm(
    LSDescriptor,
    object({ config: array(ShellEntry) }),
  ),
  LSJTerm,
);
type TwoTermLSJDescriptor = output<typeof TwoTermLSJDescriptor>;

const serializeTwoTermLSJ = (e: TwoTermLSJDescriptor): string =>
  `${serializeShellConfig(e.config.core.config)}{${
    serializeLSTerm(e.config.core.term)
  }}${serializeShellConfig(e.config.excited.config)} ${
    serializeLSJTerm(e.term)
  }`;

const serializeLatexTwoTermLSJ = (e: TwoTermLSJDescriptor): string =>
  `${serializeShellConfig(e.config.core.config)}\\left(${
    serializeLatexLSTerm(e.config.core.term)
  }\\right)${serializeShellConfig(e.config.excited.config)}\\;${
    serializeLatexLSJTerm(e.term)
  }`;

const TwoTermLSJComponent = makeComponent(
  TwoTermLSJDescriptor,
  serializeTwoTermLSJ,
  serializeLatexTwoTermLSJ,
);

export const AtomLSJTwoTerm = makeAtom(
  "AtomLSJTwoTerm",
  SpeciesBase(AtomComposition),
  TwoTermLSJComponent,
);

registerType(AtomLSJTwoTerm.plain, { id: "AtomLSJTwoTerm" });
