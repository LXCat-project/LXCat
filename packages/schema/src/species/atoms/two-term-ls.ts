// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, output } from "zod";
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
import {
  LSDescriptor,
  LSTerm,
  serializeLatexLSTerm,
  serializeLSTerm,
} from "./ls.js";
import { serializeAtom } from "./serialize.js";

const TwoTermLSDescriptor = buildTerm(
  buildTwoTerm(
    LSDescriptor,
    object({ config: array(ShellEntry) }),
  ),
  LSTerm,
);
type TwoTermLSDescriptor = output<typeof TwoTermLSDescriptor>;

const serializeTwoTermLS = (e: TwoTermLSDescriptor): string =>
  `${serializeShellConfig(e.config.core.config)}{${
    serializeLSTerm(e.config.core.term)
  }}${serializeShellConfig(e.config.excited.config)} ${
    serializeLSTerm(e.term)
  }`;

const serializeLatexTwoTermLS = (e: TwoTermLSDescriptor): string =>
  `${serializeShellConfig(e.config.core.config)}\\left(${
    serializeLatexLSTerm(e.config.core.term)
  }\\right)${serializeShellConfig(e.config.excited.config)}\\;${
    serializeLatexLSTerm(e.term)
  }`;

const TwoTermLSComponent = makeComponent(
  TwoTermLSDescriptor,
  serializeTwoTermLS,
  serializeLatexTwoTermLS,
);

export const AtomLSTwoTerm = makeAtom(
  "AtomLSTwoTerm",
  SpeciesBase(AtomComposition),
  TwoTermLSComponent,
);
