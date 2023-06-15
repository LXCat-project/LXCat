// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Provider } from "oidc-provider";

export function testOidcServer(
  client_id: string,
  client_secret: string,
  redirect_uri: string,
  port: number,
) {
  const configuration = {
    async findAccount(_ctx: any, id: string) {
      if (id === "notfound") return undefined;
      return {
        accountId: id,
        async claims() {
          return {
            sub: id,
            email: id,
            email_verified: true,
            name: id.slice(0, id.indexOf("@")),
            picture: "/lxcat.png",
            orcid: "0000-0001-2345-6789",
          };
        },
      };
    },
    clients: [
      {
        client_id,
        client_secret,
        redirect_uris: [redirect_uri],
      },
    ],
    claims: {
      email: ["email", "email_verified"],
      profile: ["name", "picture", "orcid"],
    },
    conformIdTokenClaims: false, // Make sure id_token has not just sub key
  };

  const provider = new Provider(`http://localhost:${port}`, configuration);

  // Allow http, see https://github.com/panva/node-oidc-provider/blob/main/recipes/implicit_http_localhost.md
  const schema = (provider.Client as any).Schema.prototype as any;
  const { invalidate: orig } = schema;
  schema.invalidate = function invalidate(message: any, code: any) {
    if (
      code === "implicit-force-https"
      || code === "implicit-forbid-localhost"
    ) {
      return;
    }

    orig.call(this, message);
  };

  return provider.listen(port, () => {
    console.log(
      `oidc-provider listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`,
    );
  });
}
