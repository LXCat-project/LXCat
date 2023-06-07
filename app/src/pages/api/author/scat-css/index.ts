// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { listOwned } from "@lxcat/database/dist/css/queries/author_read";
import { createSet } from "@lxcat/database/dist/css/queries/author_write";
import { getAffiliations } from "@lxcat/database/dist/shared/queries/organization";
import { validator } from "@lxcat/schema/dist/css/validate";
import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";

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
        const affiliations = await getAffiliations(req.user.email);
        if (affiliations.includes(body.contributor)) {
          // Add to CrossSectionSet with status=='draft' and version=='1'
          const id = await createSet(body, "draft");
          res.json({ id });
        } else {
          res.statusCode = 403;
          res.json({
            errors: [
              {
                message:
                  `You are not a member of the ${body.contributor} organization.`,
              },
            ],
          });
        }
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
