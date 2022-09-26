import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import { createSet } from "@lxcat/database/dist/css/queries/author_write";
import { validator } from "@lxcat/schema/dist/css/validate";
import { listOwned } from "@lxcat/database/dist/css/queries/author_read";
import {
  FilterOptions,
  search,
  SortOptions,
} from "@lxcat/database/dist/css/queries/public";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .post(async (req, res) => {
    try {
      let body = req.body;
      if (typeof body === "string") {
        body = JSON.parse(req.body);
      }
      if (validator.validate(body.doc)) {
        // Add to CrossSectionSet with status=='draft' and version=='1'
        const id = await createSet(body.doc, "draft");
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
    if (req.query.private) {
      const user = req.user;
      if (!user || "iat" in user) {
        throw Error("How did you get here?");
      }
      const items = await listOwned(user.email);
      res.json({ items });
      return;
    }
    res.status(500);
    res.end();
    // TODO make /api/scat-css return stuff when not logged in
    // TODO make adjustable by user
    // const filter: FilterOptions = {
    //   contributor: [],
    //   species2: [],
    // };
    // const sort: SortOptions = {
    //   field: "name",
    //   dir: "ASC",
    // };
    // const paging = {
    //   offset: 0,
    //   count: Number.MAX_SAFE_INTEGER,
    // };
    // const items = await search(filter, sort, paging);
    // res.json({ items });
    // return;
  });

export default handler;
