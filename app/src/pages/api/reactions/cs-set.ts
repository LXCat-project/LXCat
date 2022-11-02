import {
  getCSSets,
  Reversible,
  StateSelectionEntry,
} from "@lxcat/database/dist/cs/queries/public";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
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
      typeTags: typeTagsParam,
      reversible: reversibleParam,
    } = req.query;

    const consumes = parseParam<Array<StateSelectionEntry>>(consumesParam, []);
    const produces = parseParam<Array<StateSelectionEntry>>(producesParam, []);
    const typeTags = parseParam<Array<ReactionTypeTag>>(typeTagsParam, []);
    const reversible =
      reversibleParam && !Array.isArray(reversibleParam)
        ? (reversibleParam as Reversible)
        : Reversible.Both;

    res.json(await getCSSets(consumes, produces, typeTags, reversible));
  });

export default handler;
