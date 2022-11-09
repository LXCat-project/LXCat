// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// TODO do edge collections need schemas?
export enum Relation {
  Consumes = "Consumes", // Between a reaction and its reactants
  Produces = "Produces", // Between a reaction and its products
  HasDirectSubstate = "HasDirectSubstate", // Between a parent state and its children
  InCompound = "InCompound", // Between a state and its compounds
}
