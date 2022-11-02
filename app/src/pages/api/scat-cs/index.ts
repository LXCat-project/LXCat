import {
  byIds,
  getCSIdByReactionTemplate,
  ReactionOptions,
} from "@lxcat/database/dist/cs/queries/public";
import {
  getStateLeaf,
  StateLeaf,
} from "@lxcat/database/dist/shared/getStateLeaf";
import { NextApiResponse } from "next";
import nc from "next-connect";
import { AuthRequest } from "../../../auth/middleware";
import { parseParam } from "../../../shared/utils";

const handler = nc<AuthRequest, NextApiResponse>().get(async (req, res) => {
  const { reactions: reactionsParam, offset: offsetParam } = req.query;
  const reactions = parseParam<Array<ReactionOptions>>(reactionsParam, []);
  const offset =
    offsetParam && !Array.isArray(offsetParam) ? parseInt(offsetParam) : 0;

  const csIdsNested = await Promise.all(
    reactions.map(
      async ({
        consumes: consumesPaths,
        produces: producesPaths,
        type_tags: typeTags,
        reversible,
        set,
      }) => {
        const consumes = consumesPaths
          .map(getStateLeaf)
          .filter((leaf): leaf is StateLeaf => leaf !== undefined);
        const produces = producesPaths
          .map(getStateLeaf)
          .filter((leaf): leaf is StateLeaf => leaf !== undefined);

        if (
          !(
            consumes.length === 0 &&
            produces.length === 0 &&
            typeTags.length === 0 &&
            set.length === 0
          )
        ) {
          return getCSIdByReactionTemplate(
            consumes,
            produces,
            typeTags,
            reversible,
            set
          );
        } else {
          return [];
        }
      }
    )
  );

  const csIds = new Set(csIdsNested.flat());
  const csHeadings = await byIds(Array.from(csIds), { count: 100, offset });
  res.json(csHeadings);
});

export default handler;
