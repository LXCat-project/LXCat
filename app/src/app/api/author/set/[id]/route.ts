// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAPIToken, hasAuthorRole } from "@/app/api/middleware/auth";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { deleteSet, updateSet } from "@/author/set-operations";
import { operationResponse } from "../../operation-response";
import { deleteSchema, postSchema } from "./schemas";

const postRouter = RouteBuilder
  .init()
  .use(hasAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(postSchema))
  .post(async (_, ctx) => {
    const { path, body } = ctx.parsedParams;
    return operationResponse(
      await updateSet(ctx.user, path.id, body.doc, body.message),
    );
  })
  .compile();

const deleteRouter = RouteBuilder
  .init()
  .use(hasAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(deleteSchema))
  .delete(async (_, ctx) => {
    const { path, body } = ctx.parsedParams;
    return operationResponse(await deleteSet(ctx.user, path.id, body.message));
  })
  .compile();

export { deleteRouter as DELETE, postRouter as POST };
