import { Provider } from "next-auth/providers";
import Auth0Provider from "next-auth/providers/auth0";
import GitlabProvider from "next-auth/providers/gitlab";
import { NextAuthOptions } from "next-auth";
import { ArangoAdapter } from "./ArangoAdapter";
import OrcidProvider, { OrcidSandboxProvider } from "./OrcidProvider";
import { db } from "@lxcat/database";
import { User } from "./schema";
import logo from "../../public/lxcat.png";

const providers: Provider[] = [];
if (process.env.AUTH0_CLIENT_ID) {
  providers.push(
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
      issuer: process.env.AUTH0_ISSUER,
    })
  );
}
if (process.env.GITLAB_CLIENT_ID) {
  providers.push(
    GitlabProvider({
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
    })
  );
}
if (process.env.ORCID_CLIENT_ID) {
  if (process.env.ORCID_SANDBOX) {
    providers.push(
      OrcidSandboxProvider({
        clientId: process.env.ORCID_CLIENT_ID || "",
        clientSecret: process.env.ORCID_CLIENT_SECRET || "",
      })
    );
  } else {
    providers.push(
      OrcidProvider({
        clientId: process.env.ORCID_CLIENT_ID || "",
        clientSecret: process.env.ORCID_CLIENT_SECRET || "",
      })
    );
  }
}

export const options: NextAuthOptions = {
  providers,
  adapter: ArangoAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      const parsedUser = User.parse(user);
      if ("roles" in user) {
        session.user.roles = parsedUser.roles;
      }
      if ("orcid" in parsedUser && parsedUser.orcid !== undefined) {
        session.user.orcid = parsedUser.orcid;
      }
      return session;
    },
  },
  theme: {
    colorScheme: "auto",
    brandColor: "254779",
    logo: logo.src,
  },
};
