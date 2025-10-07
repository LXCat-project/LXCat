// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  badRequestResponse,
  forbiddenResponse,
  okJsonResponse,
} from "@/shared/api-responses";
import { db } from "@lxcat/database";
import { hasAuthorRole, hasSessionOrAPIToken } from "../../middleware/auth";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { querySchema } from "./schemas";

const postRouter = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    const affiliations = await db()
      .getAffiliations(ctx.user.email)
      .then((affiliations) => affiliations.map(({ name }) => name));

    const { doc, message } = ctx.parsedParams.body;
    if (affiliations.includes(doc.contributor)) {
      try {
        const id = await db().createSet(doc, "draft", 1, message);
        return okJsonResponse({ id });
      } catch (error: any) {
        if (error.errorNum === 1210) {
          return badRequestResponse({
            json: [
              `A dataset with name ${doc.name} already exists for ${doc.contributor}.`,
            ],
          });
        } else {
          return badRequestResponse({ json: [error.message] });
        }
      }
    } else {
      return forbiddenResponse({
        json: [
          `You are not a member of the ${doc.contributor} organization.`,
        ],
      });
    }
  })
  .compile();

const getRouter = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .get(async (_, ctx) => {
    const user = ctx.user;
    const items = await db().listOwnedSets(user.email);
    return okJsonResponse({ items });
  })
  .compile();

export { getRouter as GET, postRouter as POST };
