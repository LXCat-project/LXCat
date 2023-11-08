import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";
import { SerializedSpecies } from "../../schema/species";

export type SpeciesNode = {
  _key: string;
  species: SerializedSpecies;
  hasChildren: boolean;
};

export const getTopLevelSpecies = async () => {
  const query = aql`
    FOR state IN State
      FILTER NOT HAS(state.detailed, "electronic")
      LET hasChildren = COUNT(
        FOR child IN 1 OUTBOUND state HasDirectSubstate
          LIMIT 1
          RETURN 1
      ) == 1
      RETURN {
        _key: state._key, 
        species: UNSET(state, ["_key", "_id", "_rev"]), 
        hasChildren
      }
  `;
  const cursor: ArrayCursor<SpeciesNode> = await db().query(query);
  return cursor.all();
};

export async function getSpeciesChildren(key: string) {
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
        RETURN {
          _key: child._key, 
          species: UNSET(child, ["_key", "_id", "_rev"]), 
          hasChildren
        }
  `;

  const cursor: ArrayCursor<SpeciesNode> = await db().query(query);
  return cursor.all();
}
