import {
  getAvailableTypeTags,
  Reversible,
} from "@lxcat/database/dist/cs/queries/public";
import { StateLeaf } from "@lxcat/database/dist/shared/getStateLeaf";
import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import { parseParam } from "../../../shared/utils";

const handler = nc<AuthRequest, NextApiResponse>()
  // .use(hasSessionOrAPIToken)
  // .use(hasDeveloperRole)
  .get(async (req, res) => {
    const {
      consumes: consumesParam,
      produces: producesParam,
      reversible: reversibleParam,
      setIds: setIdsParam,
    } = req.query;

    const consumes = parseParam<Array<StateLeaf>>(consumesParam, []);
    const produces = parseParam<Array<StateLeaf>>(producesParam, []);
    const setIds = parseParam<Array<string>>(setIdsParam, []);
    const reversible =
      reversibleParam && !Array.isArray(reversibleParam)
        ? (reversibleParam as Reversible)
        : Reversible.Both;

    res.json(
      await getAvailableTypeTags(consumes, produces, reversible, setIds)
    );
  });

export default handler;
