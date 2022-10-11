import { getReactions } from "@lxcat/database/dist/cs/queries/public";
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
  .get(async (req, res) => {
    const { consumes: consumesParam, produces: producesParam } = req.query;

    const consumes =
      consumesParam && !Array.isArray(consumesParam)
        ? (JSON.parse(consumesParam) as Array<string>)
        : [];
    const produces =
      producesParam && !Array.isArray(producesParam)
        ? (JSON.parse(producesParam) as Array<string>)
        : [];

    if (consumes.length > 0 || produces.length > 0) {
      const reactions = await getReactions(consumes, produces);
      res.json(reactions);
    } else {
      res.json([]);
    }
  });

export default handler;
