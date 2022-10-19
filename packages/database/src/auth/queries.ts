import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../db";
import { Organization, Role, UserInDb } from "./schema";

export const toggleRole = async (
  userId: string,
  role: Role
): Promise<Role[] | undefined> => {
  const cursor: ArrayCursor<Role[]> = await db().query(aql`
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

export const makeAdmin = async (email: string) => {
  const roles = Role.options;
  await db().query(aql`
    FOR u IN users
        FILTER u.email == ${email}
    UPDATE u WITH {
        roles: ${roles}
    } IN users
  `);
};

export const dropUser = async (userId: string) => {
  await makeMemberless(userId);
  await db().query(aql`REMOVE { _key: ${userId} } IN users`);
};

export interface UserFromDB extends UserInDb {
  _key: string;
  organizations: string[];
}

export const getUserByKey = async (key: string) => {
  const cursor: ArrayCursor<UserInDb> = await db().query(aql`
    FOR u IN users
        FILTER u._key == ${key}
        RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
  `);
  return await cursor.next();
};

export const listUsers = async () => {
  const cursor: ArrayCursor<UserFromDB> = await db().query(aql`
    FOR u IN users
        LET organizations = (
            FOR m IN MemberOf
                FILTER m._from == u._id
                FOR o IN Organization
                    FILTER o._id == m._to
                    RETURN o.name
        )
    RETURN MERGE(UNSET(u, ["_id", "_rev", "accounts", "sessions"]), {organizations})
  `);
  return await cursor.all();
};

export interface OrganizationFromDB extends Organization {
  _key: string;
}

export const listOrganizations = async () => {
  const cursor: ArrayCursor<OrganizationFromDB> = await db().query(aql`
    FOR o IN Organization
        RETURN UNSET(o, ["_id", "_rev"])
  `);
  return await cursor.all();
};

export const userMemberships = async (email: string) => {
  const cursor: ArrayCursor<OrganizationFromDB> = await db().query(aql`
    FOR u IN users
      FILTER u.email == ${email}
      FOR m IN MemberOf
        FILTER m._from == u._id
          FOR o IN Organization
            FILTER o._id == m._to
            RETURN UNSET(o, ["_id", "_rev"])
  `);
  return await cursor.all();
};

export const setMembers = async (userKey: string, orgKeys: string[]) => {
  // For now user can only be member of single org
  // create edge if user was memberless or update edge _to when already member
  const userId = "users/" + userKey;
  await db().query(aql`
    FOR o IN Organization
      FILTER ${orgKeys} ANY == o._key
        UPSERT
          { _from: ${userId}, _to: o._id}
        INSERT
          { _from: ${userId}, _to: o._id}
        REPLACE
          { _from: ${userId}, _to: o._id}
        IN MemberOf
  `);
  // Drop any membership to all orgs not in orgKeys
  await db().query(aql`
    FOR o IN Organization
    FILTER ${orgKeys} ALL != o._key
      FOR m IN MemberOf
        FILTER m._to == o._id AND m._from == ${userId}
        REMOVE m IN MemberOf
  `);
};

export const makeMemberless = async (userKey: string) => {
  const userId = "users/" + userKey;
  await db().query(aql`
        FOR m IN MemberOf
            FILTER m._from == ${userId}
            REMOVE m IN MemberOf
    `);
  return null;
};

export const addOrganization = async (org: Organization) => {
  const cursor: ArrayCursor<string> = await db().query(aql`
        INSERT
            ${org}
        IN Organization
        RETURN NEW._key
    `);
  return await cursor.next();
};

export const dropOrganization = async (orgKey: string) => {
  // TODO check org does not own anything
  await db().query(aql`
      REMOVE {_key: ${orgKey}} IN Organization
  `);
};
