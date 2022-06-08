import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import {
  isOwner,
  publish,
} from "@lxcat/database/dist/css/queries";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .post(async (req, res) => {
    const user = req.user;
    if (!user || "iat" in user) {
      throw Error("How did you get here?");
    }
    const { id } = req.query;
    if (typeof id === "string") {
      if (await isOwner(id, user.email)) {
        await publish(id);
        const data = { id };
        res.json(data);
      } else {
        // TODO distinguish between not owned by or does not exist
        res.status(403).end("Forbidden");
      }
    }
  });

export default handler;
