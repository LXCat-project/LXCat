// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFileSync } from "fs";

/** Written by global setup, relative to the working directory. */
export const API_TOKENS_FILE = "apiTokens.json";

export type ApiTokens = {
  /** Belongs to the admin user, who has every role. */
  developer: string;
  /** Belongs to an existing user without any roles. */
  noRoles: string;
  /** Belongs to an existing user with the author role, but not the developer role. */
  authorOnly: string;
  /** Valid, but no user has this key. */
  unknownUser: string;
  /** Valid and for the admin user, but not stored for the user. */
  unregistered: string;
  /** From before tokens were stored, it only contains the email. */
  legacy: string;
  /** Belongs to the admin user, but is expired. */
  expired: string;
};

export const apiTokens = (): ApiTokens =>
  JSON.parse(readFileSync(API_TOKENS_FILE, { encoding: "utf8" }));

/** Request headers that authenticate as the user owning `token`. */
export const bearer = (token: string = apiTokens().developer) => ({
  Authorization: `Bearer ${token}`,
});
