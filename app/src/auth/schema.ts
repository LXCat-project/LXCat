import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const Session = z.object({
    expires: z.string(),
    sessionToken: z.string(),
}).strict()

const Account = z.object({
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
    expires_at: z.number().optional(),
    created_at: z.number().optional(),
}).strict()

export const User = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    image: z.string().optional(),
    emailVerified: z.string().optional(),
    accounts: z.array(Account).optional(),
    sessions: z.array(Session).optional(),
}).strict()

export type User = z.infer<typeof User>;

export const UserJsonSchema = zodToJsonSchema(User)
