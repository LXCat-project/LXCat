// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

export enum ParticleType {
  Atom,
  Molecule,
}

export enum Parity {
  Gerade = "gerade",
  Ungerade = "ungerade",
}

export enum ReactionTypeTag {
  Elastic = "Elastic",
  Effective = "Effective",
  Electronic = "Electronic",
  Vibrational = "Vibrational",
  Rotational = "Rotational",
  Attachment = "Attachment",
  Ionization = "Ionization",
}

export enum Storage {
  Constant = "Constant",
  LUT = "LUT",
  Expression = "Expression",
  HardSphere = "HardSphere",
  ESMSV = "ESMSV",
  LennardJonesLaricchiuta = "LennardJonesLaricchiuta",
}
