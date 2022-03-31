import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export const Session = z.object({
    expires: z.string(),
    sessionToken: z.string(),
}).strict()
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
})
export type Account = z.infer<typeof Account>;

export const APIToken =  z.object({
    name: z.string(),
    apiToken: z.string(),
    expires: z.string().optional()
})

export const Role = z.enum(["admin", "editor", "developer", "author"])
export type Role = z.infer<typeof Role>;

export const User = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    image: z.string().optional(),
    emailVerified: z.string().optional(),
    accounts: z.array(Account).optional(),
    sessions: z.array(Session).optional(),
    apitokens: z.array(APIToken).optional(),
    roles: z.array(Role).optional(),
}).strict()

export type User = z.infer<typeof User>;

export const UserJsonSchema = zodToJsonSchema(User)
