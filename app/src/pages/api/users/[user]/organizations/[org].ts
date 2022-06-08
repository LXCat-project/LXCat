import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAdminRole,
  hasSession,
} from "../../../../../auth/middleware";
import { makeMember } from "@lxcat/database/src/auth/queries";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSession)
  .use(hasAdminRole)
  .post(async (req, res) => {
    const { user: userId, org: orgId } = req.query;
    if (typeof userId === "string" && typeof orgId === "string") {
      const user = await makeMember(userId, orgId);
      return res.json(user);
    }
  });

export default handler;
