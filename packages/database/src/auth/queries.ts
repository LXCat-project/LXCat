// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { LXCatDatabase } from "../lxcat-database";
import { Organization, Role, UserInDb } from "./schema";

export async function toggleRole(
  this: LXCatDatabase,
  userId: string,
  role: Role,
): Promise<Role[] | undefined> {
  const cursor: ArrayCursor<Role[]> = await this.db.query(aql`
        LET role = ${role}
        FOR u IN users
            FILTER u._key == ${userId}
        UPDATE u WITH {
            roles: POSITION(u.roles, role) ? REMOVE_VALUE(u.roles, role) : PUSH(u.roles, role, true)
        } IN users
        RETURN NEW.roles
    `);
  return await cursor.next();
}

export async function makeAdmin(this: LXCatDatabase, email: string) {
  const roles = Role.options;
  await this.db.query(aql`
    FOR u IN users
        FILTER u.email == ${email}
    UPDATE u WITH {
        roles: ${roles}
    } IN users
  `);
}

export async function dropUser(this: LXCatDatabase, userId: string) {
  await this.stripAffiliations(userId);
  await this.db.query(aql`REMOVE { _key: ${userId} } IN users`);
}

export interface UserFromDB extends UserInDb {
  _key: string;
  organizations: string[];
}

export async function getUserByKey(this: LXCatDatabase, key: string) {
  const cursor: ArrayCursor<UserInDb> = await this.db.query(aql`
    FOR u IN users
        FILTER u._key == ${key}
        RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
  `);
  return await cursor.next();
}

export async function listUsers(this: LXCatDatabase) {
  const cursor: ArrayCursor<UserFromDB> = await this.db.query(aql`
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
}

export interface OrganizationFromDB extends Organization {
  _key: string;
}

export async function listOrganizations(this: LXCatDatabase) {
  const cursor: ArrayCursor<OrganizationFromDB> = await this.db.query(aql`
    FOR o IN Organization
        RETURN UNSET(o, ["_id", "_rev"])
  `);
  return await cursor.all();
}

export async function getAffiliations(this: LXCatDatabase, email: string) {
  const cursor: ArrayCursor<OrganizationFromDB> = await this.db.query(aql`
    FOR u IN users
      FILTER u.email == ${email}
      FOR org IN OUTBOUND u MemberOf
        RETURN UNSET(org, ["_id", "_rev"])
  `);
  return await cursor.all();
}

export async function setAffiliations(
  this: LXCatDatabase,
  userKey: string,
  orgKeys: string[],
) {
  // For now user can only be member of single org
  // create edge if user was memberless or update edge _to when already member
  const userId = "users/" + userKey;
  await this.db.query(aql`
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
  await this.db.query(aql`
    FOR o IN Organization
    FILTER ${orgKeys} ALL != o._key
      FOR m IN MemberOf
        FILTER m._to == o._id AND m._from == ${userId}
        REMOVE m IN MemberOf
  `);
}

export async function stripAffiliations(this: LXCatDatabase, userKey: string) {
  const userId = "users/" + userKey;
  await this.db.query(aql`
        FOR m IN MemberOf
            FILTER m._from == ${userId}
            REMOVE m IN MemberOf
    `);
  return null;
}

export async function addOrganization(this: LXCatDatabase, org: Organization) {
  const cursor: ArrayCursor<string> = await this.db.query(aql`
        INSERT
            ${org}
        IN Organization
        RETURN NEW._key
    `);
  return await cursor.next();
}

export async function dropOrganization(this: LXCatDatabase, orgKey: string) {
  // TODO check org does not own anything
  await this.db.query(aql`
      REMOVE {_key: ${orgKey}} IN Organization
  `);
}
