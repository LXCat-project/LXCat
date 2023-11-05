import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";
import { SerializedSpecies } from "../../schema/species";

export const getTopLevelSpecies = async () => {
  const query = aql`
    FOR state IN State
      FILTER NOT HAS(state.detailed, "electronic")
      RETURN UNSET(state, ["_id", "_rev"])
  `;
  const cursor = await db().query(query);
  return cursor.all();
};

export async function getSpeciesChildren(key: string) {
  const query = aql`
    FOR s IN State
      FILTER s._key == ${key}
      LIMIT 1
      FOR child IN 1 OUTBOUND s HasDirectSubstate
        RETURN UNSET(child, ["_id", "_rev"])
  `;

  const cursor: ArrayCursor<SerializedSpecies> = await db().query(query);
  return cursor.all();
}
