// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
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
import { deleteSchema, postSchema } from "./schemas";

const postRouter = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(postSchema))
  .post(async (_, ctx) => {
    const params = ctx.parsedParams;
    if (await db().isOwnerOfSet(params.path.id, ctx.user.email)) {
      try {
        const newId = await db().updateSet(
          params.path.id,
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
    const id = ctx.parsedParams.path.id;

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
