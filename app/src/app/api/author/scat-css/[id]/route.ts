import { db } from "@lxcat/database";
import { KeyedDocument } from "@lxcat/database/schema";
import { z } from "zod";
import {
  badRequestResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  notFoundResponse,
  okJsonResponse,
} from "../../../../../shared/api-responses";
import { hasAuthorRole, hasSessionOrAPIToken } from "../../../middleware/auth";
import { zodMiddleware } from "../../../middleware/zod";
import { RouteBuilder } from "../../../route-builder";

export const postSchema = z.object({
  query: z.object({ id: z.string() }),
  body: z.object({ doc: KeyedDocument, message: z.string() }),
});

// TODO: Define max length for `id` and `message`.
export const deleteSchema = z.object({
  query: z.object({ id: z.string().min(1) }),
  body: z.object({ message: z.optional(z.string().min(1)) }),
});

const postRouter = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(postSchema))
  .post(async (_, ctx) => {
    const params = ctx.parsedParams;
    if (await db().isOwnerOfSet(params.query.id, ctx.user.email)) {
      try {
        const newId = await db().updateSet(
          params.query.id,
          params.body.doc,
          params.body.message,
        );
        const data = { id: newId };
        return okJsonResponse(data);
      } catch (error) {
        console.error(error);
        return internalServerErrorResponse({
          json: {
            errors: [
              {
                keyword: "server",
                dataPath: "",
                schemaPath: "",
                params: {},
                message: `${error}`,
              },
            ],
          },
        });
      }
    } else {
      // TODO distinguish between not owned by or does not exist
      return forbiddenResponse();
    }
  })
  .compile();

const deleteRouter = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(deleteSchema))
  .delete(async (_, ctx) => {
    const id = ctx.parsedParams.query.id;

    const versionInfo = await db().getSetVersionInfo(id);

    if (versionInfo === undefined) {
      return notFoundResponse({ body: `Item with id ${id} does not exist.` });
    }

    if (
      await db().isOwnerOfSet(id, ctx.user.email)
    ) {
      if (
        versionInfo.status === "draft" && ctx.user.roles?.includes("author")
      ) {
        await db().removeDraftSetUnchecked(id);
      } else if (
        versionInfo.status === "published"
        && ctx.user.roles?.includes("publisher")
      ) {
        if (
          ctx.parsedParams.body.message === undefined
          || ctx.parsedParams.body.message === ""
        ) {
          return badRequestResponse({
            body: "Retracting a published dataset requires a commit message.",
          });
        }
        await db().retractSetUnchecked(id, ctx.parsedParams.body.message);
      }
      return okJsonResponse({ id });
    } else {
      return forbiddenResponse({
        body: "This cross section set is not owned by you.",
      });
    }
  })
  .compile();

export { deleteRouter as DELETE, postRouter as POST };
