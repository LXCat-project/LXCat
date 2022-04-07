import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../db";
import { ArangoAdapter } from "./ArangoAdapter";
import { Role, User } from "./schema";

export const toggleRole = async (userId: string, role: Role): Promise<Role[] | undefined> => {
    const cursor: ArrayCursor<Role[]> = await db.query(aql`
        LET role = ${role}
        FOR u IN users
            FILTER u._key == ${userId}
        UPDATE u WITH {
            roles: POSITION(u.roles, role) ? REMOVE_VALUE(u.roles, role) : PUSH(u.roles, role, true)
        } IN users
        RETURN NEW.roles
    `)
    return await cursor.next()
}

export const dropUser = async (userId: string) => {
    const adapter = ArangoAdapter(db)
    await adapter.deleteUser!(userId)
}

export const listUsers = async () =>{
    const cursor = await db.query(aql`
    FOR u IN users
    RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
  `)
  const users = await cursor.all() as User[]
  return users
}