import {
  getAvailableTypeTags,
  Reversible,
  StateSelectionEntry,
} from "@lxcat/database/dist/cs/queries/public";
import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import { parseParam } from "../../../shared/utils";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperRole)
  .get(async (req, res) => {
    const {
      consumes: consumesParam,
      produces: producesParam,
      reversible: reversibleParam,
    } = req.query;

    const consumes = parseParam<Array<StateSelectionEntry>>(consumesParam, []);
    const produces = parseParam<Array<StateSelectionEntry>>(producesParam, []);
    const reversible =
      reversibleParam && !Array.isArray(reversibleParam)
        ? reversibleParam as Reversible
        : Reversible.Both;

    res.json(await getAvailableTypeTags(consumes, produces, reversible));
  });

export default handler;
