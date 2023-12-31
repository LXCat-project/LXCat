// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { PartialKeyedDocument } from "@lxcat/database/schema";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .post(async (req, res) => {
    try {
      let body = req.body;
      if (typeof body === "string") {
        body = JSON.parse(body);
      }
      const parseResult = PartialKeyedDocument.safeParse(body);
      if (parseResult.success) {
        const affiliations = await db()
          .getAffiliations(req.user.email)
          .then((affiliations) => affiliations.map(({ name }) => name));

        const doc = parseResult.data;
        if (affiliations.includes(doc.contributor)) {
          // Add to CrossSectionSet with status=='draft' and version=='1'
          const id = await db().createSet(doc, "draft");
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
        const errors = parseResult.error.errors;
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
    const items = await db().listOwnedSets(user.email);
    res.json({ items });
    return;
  })
  .handler();

export default handler;
