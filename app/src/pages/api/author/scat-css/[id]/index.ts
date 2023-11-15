// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { KeyedDocument } from "@lxcat/database/schema";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../../../auth/middleware";

// TODO: Define max length for `id` and `message`.
const DELETE_SCHEMA = z.object({
  query: z.object({ id: z.string().min(1) }),
  body: z.object({ message: z.optional(z.string().min(1)) }),
});

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .post(async (req, res) => {
    const user = req.user;
    const { id } = req.query;
    if (typeof id === "string") {
      const body = req.body;

      const parseResults = KeyedDocument.safeParse(body.doc);

      if (parseResults.success) {
        if (await db().isOwnerOfSet(id, user.email)) {
          try {
            const newId = await db().updateSet(
              id,
              parseResults.data,
              body.message,
            );
            const data = { id: newId };
            res.json(data);
          } catch (error) {
            console.error(error);
            res.statusCode = 500;
            res.json({
              errors: [
                {
                  keyword: "server",
                  dataPath: "",
                  schemaPath: "",
                  params: {},
                  message: `${error}`,
                },
              ],
            });
          }
        } else {
          // TODO distinguish between not owned by or does not exist
          res.status(403).end("Forbidden");
        }
      } else {
        const errors = parseResults.error.errors;
        res.statusCode = 500;
        res.json({ errors });
        return;
      }
    }
  })
  .delete(async (req, res) => {
    const user = req.user;
    const request = DELETE_SCHEMA.safeParse(req);

    if (request.success) {
      const { query: { id }, body: { message } } = request.data;

      const versionInfo = await db().getSetVersionInfo(id);

      if (versionInfo === undefined) {
        res.status(204).end(`Item with id ${id} does not exist.`);
        return;
      }

      if (
        await db().isOwnerOfSet(id, user.email)
      ) {
        if (versionInfo.status === "draft" && user.roles?.includes("author")) {
          await db().removeDraftSetUnchecked(id);
        } else if (
          versionInfo.status === "published"
          && user.roles?.includes("publisher")
        ) {
          if (message === undefined || message === "") {
            res.status(400).send(
              "Retracting a published dataset requires a commit message.",
            );
            return;
          }
          await db().retractSetUnchecked(id, message);
        }
        const data = { id };
        res.json(data);
      } else {
        res.status(403).end("This cross section set is not owned by you.");
      }
    } else {
      res.status(400).json(request.error.format());
    }
  })
  .handler();

export default handler;
