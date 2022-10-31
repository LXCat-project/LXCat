import { DocumentData } from "arangojs/documents";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const Session = z
  .object({
    expires: z.preprocess((arg) => {
      // ArangoDB does not handle Date object so convert to iso960 formatted string
      if (arg instanceof Date) {
        return arg.toISOString();
      }
      if (arg === null) {
        // next-auth uses null when absent
        // zod uses undefined when absent
        return undefined;
      }
      return arg;
    }, z.string()),
    sessionToken: z.string(),
  })
  .strict();
export type Session = z.infer<typeof Session>;

export const Account = z.object({
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().optional(),
  access_token: z.string().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  id_token: z.string().optional(),
  session_state: z.string().optional(),
  oauth_token_secret: z.string().optional(),
  oauth_token: z.string().optional(),
});
export type Account = z.infer<typeof Account>;

export const Role = z.enum([
  "admin",
  "editor", // TODO remove or implement
  "developer",
  "author",
  "download",
]);
export type Role = z.infer<typeof Role>;

export const User = z.object({
  name: z.string().optional(),
  email: z.string(),
  image: z.string().optional(),
  emailVerified: z.preprocess((arg) => {
    // ArangoDB does not handle Date object so convert to iso960 formatted string
    if (arg instanceof Date) {
      return arg.toISOString();
    }
    if (arg === null) {
      // next-auth uses null when absent
      // zod uses undefined when absent
      return undefined;
    }
    return arg;
  }, z.string().optional()),
  roles: z.array(Role).optional(),
  orcid: z.string().optional(),
});

export type User = z.infer<typeof User>;

export type UserInDb = DocumentData<z.infer<typeof User>>;

export const UserWithAccountSessionInDb = User.extend({
  roles: z.array(Role).optional().default([]), // Same as User.roles, but defaults to []
  accounts: z.array(Account).optional().default([]),
  sessions: z.array(Session).optional().default([]),
});

export type UserWithAccountSessionInDb = z.infer<
  typeof UserWithAccountSessionInDb
>;

export const UserWithAccountSessionInDbAsJsonSchema = zodToJsonSchema(
  UserWithAccountSessionInDb
);

export const Organization = z.object({
  name: z.string(),
});

export type Organization = z.infer<typeof Organization>;

export const OrganizationAsJsonSchema = zodToJsonSchema(Organization);
