import NextAuth from "next-auth"
import { Provider } from "next-auth/providers";
import Auth0Provider from "next-auth/providers/auth0";
import GitlabProvider from "next-auth/providers/gitlab";
import { ArangoAdapter } from "../../../auth/ArangoAdapter";
import OrcidProvider, { OrcidSandboxProvider } from "../../../auth/OrcidProvider";
import { db } from "../../../db";

const providers: Provider[] = []
if (process.env.AUTH0_CLIENT_ID) {
  providers.push(Auth0Provider({
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
    issuer: process.env.AUTH0_ISSUER
  }))
}
if (process.env.GITLAB_CLIENT_ID) {
  providers.push(GitlabProvider({
    clientId: process.env.GITLAB_CLIENT_ID,
    clientSecret: process.env.GITLAB_CLIENT_SECRET
  }))
}
if (process.env.ORCID_CLIENT_ID) {
  if (process.env.ORCID_SANDBOX) {
    providers.push(OrcidSandboxProvider({
      clientId: process.env.ORCID_CLIENT_ID || '',
      clientSecret: process.env.ORCID_CLIENT_SECRET || ''
    }))
  } else {
    providers.push(OrcidProvider({
      clientId: process.env.ORCID_CLIENT_ID || '',
      clientSecret: process.env.ORCID_CLIENT_SECRET || ''
    }))
  }
}

export default NextAuth({
  providers,
  adapter: ArangoAdapter(db)
})
