import { getAvailableTypeTags } from "@lxcat/database/dist/shared/queries/reaction";
import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperRole)
  .get(async (_, res) => {
    const typeTags = await getAvailableTypeTags();
    res.json(typeTags);
  });

export default handler;
