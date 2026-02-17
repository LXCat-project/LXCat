// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { User } from "@lxcat/database/auth";
import { NextAuthOptions } from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";
import GithubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";
import { Provider } from "next-auth/providers/index";
import KeycloakProvider from "next-auth/providers/keycloak";
import { env } from "process";
import logo from "../../public/lxcat.png";
import { ArangoAdapter } from "./arango-adapter";
import OrcidProvider, { OrcidSandboxProvider } from "./orcid-provider";

const providers: Provider[] = [];
if (process.env.AUTH0_CLIENT_ID) {
  providers.push(
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
      issuer: process.env.AUTH0_ISSUER,
    }),
  );
}
if (process.env.GITLAB_CLIENT_ID) {
  providers.push(
    GitlabProvider({
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET || "",
    }),
  );
}
if (process.env.GITHUB_CLIENT_ID) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  );
}
if (process.env.KEYCLOAK_CLIENT_ID) {
  providers.push(
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  );
}
if (process.env.ORCID_CLIENT_ID) {
  if (process.env.ORCID_SANDBOX) {
    providers.push(
      OrcidSandboxProvider({
        clientId: process.env.ORCID_CLIENT_ID || "",
        clientSecret: process.env.ORCID_CLIENT_SECRET || "",
      }),
    );
  } else {
    providers.push(
      OrcidProvider({
        clientId: process.env.ORCID_CLIENT_ID || "",
        clientSecret: process.env.ORCID_CLIENT_SECRET || "",
      }),
    );
  }
}
if (process.env.TESTOIDC_CLIENT_ID) {
  const nextauthUrl = new URL(process.env.NEXTAUTH_URL!);
  if (nextauthUrl.hostname !== "localhost") {
    throw Error(
      "Can not use test oidc auth provider unless NEXTAUTH_URL env var is on localhost",
    );
  }
  providers.push({
    id: "testoidc",
    name: "Test dummy",
    type: "oauth",
    wellKnown: env.TESTOIDC_CLIENT_ISSUER + "/.well-known/openid-configuration",
    clientId: process.env.TESTOIDC_CLIENT_ID || "",
    clientSecret: process.env.TESTOIDC_CLIENT_SECRET || "",
    authorization: { params: { scope: "openid email profile" } },
    idToken: true,
    checks: ["pkce", "state"],
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        orcid: profile.orcid,
      };
    },
  });
}

export const options: NextAuthOptions = {
  providers,
  adapter: ArangoAdapter(db()),
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
