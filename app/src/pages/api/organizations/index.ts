import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAdminRole,
  hasSession,
} from "../../../auth/middleware";
import { Organization } from "@lxcat/database/dist/auth/schema";
import { addOrganization } from "@lxcat/database/dist/auth/queries";

const handler = nc<AuthRequest, NextApiResponse>()
  //   .use(hasSession)
  //   .use(hasAdminRole)
  .post(async (req, res) => {
    const org = Organization.parse(req.body);
    const _key = await addOrganization(org);
    res.json({
      ...org,
      _key,
    });
  });

export default handler;
