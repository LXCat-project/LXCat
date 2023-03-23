// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { isOwner } from "@lxcat/database/dist/css/queries/author_read";
import {
  deleteSet,
  updateSet,
} from "@lxcat/database/dist/css/queries/author_write";
import { validator } from "@lxcat/schema/dist/css/validate";
import { NextApiResponse } from "next";
import nc from "next-connect";
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

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .post(async (req, res) => {
    const user = req.user;
    const { id } = req.query;
    if (typeof id === "string") {
      const body = req.body;
      if (validator.validate(body.doc)) {
        if (await isOwner(id, user.email)) {
          try {
            const newId = await updateSet(id, body.doc, body.message);
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
        const errors = validator.errors;
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

      if (await isOwner(id, user.email)) {
        await deleteSet(id, message);
        const data = { id };
        res.json(data);
      } else {
        // TODO distinguish between not owned by or does not exist
        res.status(403).end("Forbidden");
      }
    } else {
      res.status(400).json(request.error.format());
    }
  });

export default handler;
