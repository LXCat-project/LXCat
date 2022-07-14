import { aql } from "arangojs";
import { db } from "../../db";

export async function dropStates(stateIds: string[]) {
    await db().query(aql`
        FOR s IN State
            FILTER s._key == ANY ${stateIds}
            REMOVE s IN State
    `)
}