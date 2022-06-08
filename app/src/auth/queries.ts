import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../db";
import { ArangoAdapter } from "./ArangoAdapter";
import { Organization, Role, UserInDb } from "./schema";

export const toggleRole = async (
  userId: string,
  role: Role
): Promise<Role[] | undefined> => {
  const cursor: ArrayCursor<Role[]> = await db.query(aql`
        LET role = ${role}
        FOR u IN users
            FILTER u._key == ${userId}
        UPDATE u WITH {
            roles: POSITION(u.roles, role) ? REMOVE_VALUE(u.roles, role) : PUSH(u.roles, role, true)
        } IN users
        RETURN NEW.roles
    `);
  return await cursor.next();
};

export const dropUser = async (userId: string) => {
  const adapter = ArangoAdapter(db);
  await adapter.deleteUser!(userId);
};

export interface UserFromDB extends UserInDb {
  _key: string;
  organization?: string;
}

export const listUsers = async () => {
  const cursor: ArrayCursor<UserFromDB> = await db.query(aql`
    FOR u IN users
        LET organization = FIRST(
            FOR m IN MemberOf
                FILTER m._from == u._id
                FOR o IN Organization
                    FILTER o._id == m._to
                    RETURN o.name
        )
    RETURN MERGE(UNSET(u, ["_id", "_rev", "accounts", "sessions"]), {organization})
  `);
  return await cursor.all();
};

export interface OrganizationFromDB extends Organization {
  _key: string;
}

export const listOrganizations = async () => {
  const cursor: ArrayCursor<OrganizationFromDB> = await db.query(aql`
    FOR o IN Organization
        RETURN UNSET(o, ["_id", "_rev"])
  `);
  return await cursor.all();
};

export const makeMember = async (userKey: string, orgKey: string) => {
  // For now user can only be member of single org
  // create edge if user was memberless or update edge _to when already member
  const userId = "users/" + userKey;
  const orgId = "Organization/" + orgKey;
  const cursor: ArrayCursor<OrganizationFromDB> = await db.query(aql`
        UPSERT
            { _from: ${userId}}
        INSERT
            { _from: ${userId}, _to: ${orgId}}
        REPLACE
            { _from: ${userId}, _to: ${orgId}}
        IN MemberOf
        FOR o IN Organization
            FILTER o._key == ${orgKey}
            RETURN UNSET(o, ["_id", "_rev"])
    `);
  return await cursor.next();
};

export const makeMemberless = async (userKey: string) => {
  const userId = "users/" + userKey;
  await db.query(aql`
        FOR m IN MemberOf
            FILTER m._from == ${userId}
            REMOVE m IN MemberOf
    `);
  return null;
};
