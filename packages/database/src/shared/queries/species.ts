// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SerializedSpecies } from "@lxcat/schema/species";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { LXCatDatabase } from "../../lxcat-database.js";

export type SpeciesNode = {
  _key: string;
  species: SerializedSpecies;
  hasChildren: boolean;
};

export async function getTopLevelSpecies(this: LXCatDatabase) {
  const query = aql`
    FOR state IN State
      FILTER NOT HAS(state.detailed, "electronic")
      LET hasChildren = COUNT(
        FOR child IN 1 OUTBOUND state HasDirectSubstate
          LIMIT 1
          RETURN 1
      ) == 1
      LET composition = FIRST(
        FOR c IN Composition
          FILTER state.detailed.composition == c._id
          return c.definition
      )
      RETURN {
        _key: state._key, 
        species: MERGE_RECURSIVE(UNSET(state, ["_key", "_id", "_rev"]), {detailed: {composition}}), 
        hasChildren
      }
  `;

  const cursor: ArrayCursor<SpeciesNode> = await this.db.query(query);
  return cursor.all();
}

export async function getSpeciesChildren(this: LXCatDatabase, key: string) {
  const query = aql`
    FOR s IN State
      FILTER s._key == ${key}
      LIMIT 1
      FOR child IN 1 OUTBOUND s HasDirectSubstate
        LET hasChildren = COUNT(
          FOR grandChild IN 1 OUTBOUND child HasDirectSubstate
            LIMIT 1
            RETURN 1
        ) == 1
        LET composition = FIRST(
          FOR c IN Composition
            FILTER child.detailed.composition == c._id
            return c.definition
        )
        RETURN {
          _key: child._key, 
          species: MERGE_RECURSIVE(UNSET(child, ["_key", "_id", "_rev"]), {detailed: {composition}}), 
          hasChildren
        }
  `;

  const cursor: ArrayCursor<SpeciesNode> = await this.db.query(query);
  return cursor.all();
}
