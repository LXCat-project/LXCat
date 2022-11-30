// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { createSet } from "@lxcat/database/dist/css/queries/author_write";
import { validator } from "@lxcat/schema/css/validate";
import { listOwned } from "@lxcat/database/dist/css/queries/author_read";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .post(async (req, res) => {
    try {
      let body = req.body;
      if (typeof body === "string") {
        body = JSON.parse(body);
      }
      if (validator.validate(body)) {
        // Add to CrossSectionSet with status=='draft' and version=='1'
        const id = await createSet(body, "draft");
        res.json({ id });
      } else {
        const errors = validator.errors;
        res.statusCode = 500;
        res.json({ errors });
      }
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.json({
        errors: [
          {
            keyword: "",
            dataPath: "",
            schemaPath: "",
            params: {},
            message: `${error}`,
          },
        ],
      });
    }
  })
  .get(async (req, res) => {
    const user = req.user;
    const items = await listOwned(user.email);
    res.json({ items });
    return;
  });

export default handler;
