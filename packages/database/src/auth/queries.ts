// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Contributor } from "@lxcat/schema";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor.js";
import { LXCatDatabase } from "../lxcat-database.js";
import type {
  Account,
  KeyedOrganization,
  Session,
  SessionDiff,
  UserDiff,
  UserFromDB,
  UserInDb,
  UserWithAccountSessionInDb,
} from "./schema.js";
import { Role } from "./schema.js";

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

export async function addUser(
  this: LXCatDatabase,
  user: UserWithAccountSessionInDb,
) {
  const cursor = await this.db.query<string>(aql`
      INSERT ${user} INTO users LET r = NEW RETURN r._key
    `);
  return cursor.next();
}

export async function dropUser(this: LXCatDatabase, userId: string) {
  await this.stripAffiliations(userId);
  await this.db.query(aql`REMOVE { _key: ${userId} } IN users`);
}

export async function getUserByKey(this: LXCatDatabase, key: string) {
  const cursor: ArrayCursor<UserInDb> = await this.db.query(aql`
    FOR u IN users
      FILTER u._key == ${key}
      RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
  `);
  return cursor.next();
}

export async function getUserByEmail(this: LXCatDatabase, email: string) {
  const cursor = await this.db.query<UserInDb>(aql`
    FOR u IN users
      FILTER u.email == ${email}
      RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
  `);
  return cursor.next();
}

export async function getUserByAccount(
  this: LXCatDatabase,
  provider: string,
  providerAccountId: string,
) {
  const cursor = await this.db.query<UserInDb>(aql`
      FOR u IN users
        FOR a IN u.accounts
          FILTER
            a.provider == ${provider}
            AND a.providerAccountId == ${providerAccountId}
          RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
    `);
  return cursor.next();
}

export async function updateUser(this: LXCatDatabase, userDiff: UserDiff) {
  const cursor = await this.db.query<UserInDb>(aql`
    FOR u IN users
      FILTER u._key == ${userDiff._key}
      UPDATE u WITH ${userDiff} IN users
      LET updated = NEW
      RETURN UNSET(updated, ["_id", "_rev", "accounts", "sessions"])
  `);
  return cursor.next();
}

export async function linkAccount(
  this: LXCatDatabase,
  id: string,
  account: Account,
) {
  await this.db.query(aql`
      FOR u IN users
        FILTER u._key == ${id}
        UPDATE u WITH {
            accounts: PUSH(u.accounts, ${account}, true)
        } IN users
    `);
}

export async function unlinkAccount(
  this: LXCatDatabase,
  provider: string,
  providerAccountId: string,
) {
  await this.db.query(aql`
      FOR u IN users
        FOR a IN u.accounts
          FILTER a.provider == ${provider}
            AND a.providerAccountId == ${providerAccountId}
          UPDATE u WITH {
            accounts: REMOVE_VALUE(u.accounts, a)
          } IN users
    `);
}

export async function addSession(
  this: LXCatDatabase,
  userId: string,
  session: Session,
) {
  await this.db.query(aql`
      FOR u IN users
        FILTER u._key == ${userId}
        UPDATE u WITH {
          sessions: PUSH(u.sessions, ${session}, true)
        } IN users
    `);
}

export async function getSessionAndUser(
  this: LXCatDatabase,
  sessionToken: string,
) {
  const cursor = await this.db.query<{ session: Session; user: UserInDb }>(aql`
      FOR u IN users
        FOR s IN u.sessions
          FILTER s.sessionToken == ${sessionToken}
      RETURN {session: s, user: UNSET(u, ["_id", "_rev", "accounts", "sessions"])}
    `);
  return cursor.next();
}

export async function updateSession(
  this: LXCatDatabase,
  sessionDiff: SessionDiff,
) {
  const cursor = await this.db.query<{ userId: string; session: Session }>(aql`
      FOR u IN users
        FOR s IN u.sessions
          FILTER s.sessionToken == ${sessionDiff.sessionToken}
          UPDATE u WITH {
            sessions: PUSH(REMOVE_VALUE(u.sessions, s), ${sessionDiff})
          } IN users
          LET updated = NEW
          RETURN {session: LAST(updated.session), userId: update._key}
    `);
  return cursor.next();
}

export async function dropSession(this: LXCatDatabase, sessionToken: string) {
  await this.db.query(aql`
      FOR u IN users
        FOR s IN u.sessions
          FILTER s.sessionToken == ${sessionToken}
          UPDATE u WITH {
              sessions: REMOVE_VALUE(u.sessions, s)
          } IN users
    `);
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

export type ContributorWithStats = Contributor & { nSets: number };

export async function listContributors(this: LXCatDatabase) {
  const cursor: ArrayCursor<ContributorWithStats> = await this.db.query(aql`
    FOR o IN Organization
      let nSets = COUNT(
        FOR set IN CrossSectionSet
          FILTER set.organization == o._id
          RETURN 1
      )
      SORT nSets DESC, o.name
      RETURN MERGE(UNSET(o, ["_id", "_rev", "_key"]), {nSets: nSets})
  `);
  return await cursor.all();
}

export async function listOrganizations(this: LXCatDatabase) {
  const cursor: ArrayCursor<KeyedOrganization> = await this.db.query(aql`
    FOR o IN Organization
        RETURN { _key: o._key, name: o.name }
  `);
  return await cursor.all();
}

export async function getAffiliations(this: LXCatDatabase, email: string) {
  const cursor: ArrayCursor<KeyedOrganization> = await this.db.query(aql`
    FOR u IN users
      FILTER u.email == ${email}
      FOR org IN OUTBOUND u MemberOf
        RETURN { _key: org._key, name: org.name }
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

export async function addOrganization(this: LXCatDatabase, org: Contributor) {
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
