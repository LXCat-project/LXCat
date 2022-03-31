import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import type { User as LocalUser } from "./schema"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  type User = Localuser

  interface Session {
    user: User
  }
}