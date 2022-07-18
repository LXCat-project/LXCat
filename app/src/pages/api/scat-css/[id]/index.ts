import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import {
  isOwner,
} from "@lxcat/database/dist/css/queries/author_read";
import { validator } from "@lxcat/schema/dist/css/validate";
import { byId } from "@lxcat/database/dist/css/queries/public";
import { deleteSet, updateSet } from "@lxcat/database/dist/css/queries/author_write";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperRole)
  .get(async (req, res) => {
    const { id } = req.query;
    if (typeof id === "string") {
      const data = await byId(id);
      res.json(data);
    }
  })
  .use(hasAuthorRole)
  .post(async (req, res) => {
    const user = req.user;
    if (!user || "iat" in user) {
      throw Error("How did you get here?");
    }
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
                  keyword: "",
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
    if (!user || "iat" in user) {
      throw Error("How did you get here?");
    }
    const { id } = req.query;
    if (typeof id === "string") {
      if (await isOwner(id, user.email)) {
        await deleteSet(id, req.body.message);
        const data = { id };
        res.json(data);
      } else {
        // TODO distinguish between not owned by or does not exist
        res.status(403).end("Forbidden");
      }

      const data = { id };
      res.json(data);
    }
  });

export default handler;
