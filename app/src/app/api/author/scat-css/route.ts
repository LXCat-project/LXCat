import { db } from "@lxcat/database";
import {
  forbiddenResponse,
  okJsonResponse,
} from "../../../../shared/api-responses";
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

    const doc = ctx.parsedParams.body;
    if (affiliations.includes(doc.contributor)) {
      // Add to CrossSectionSet with status=='draft' and version=='1'
      const id = await db().createSet(doc, "draft");
      okJsonResponse({ id });
    } else {
      return forbiddenResponse({
        json: {
          errors: [
            {
              message:
                `You are not a member of the ${ctx.parsedParams.body.contributor} organization.`,
            },
          ],
        },
      });
    }
    return okJsonResponse({});
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
