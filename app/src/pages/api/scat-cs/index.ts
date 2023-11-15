// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { ReactionTemplate } from "@lxcat/database/item/picker";
import { getStateLeaf, StateLeaf } from "@lxcat/database/shared";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { AuthRequest } from "../../../auth/middleware";
import { parseParam } from "../../../shared/utils";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .get(async (req, res) => {
    const { reactions: reactionsParam, offset: offsetParam } = req.query;
    const reactions = parseParam<Array<ReactionTemplate>>(reactionsParam, []);
    const offset = offsetParam && !Array.isArray(offsetParam)
      ? parseInt(offsetParam)
      : 0;

    const csIdsNested = await Promise.all(
      reactions.map(
        async ({
          consumes: consumesPaths,
          produces: producesPaths,
          typeTags: typeTags,
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
              consumes.length === 0
              && produces.length === 0
              && typeTags.length === 0
              && set.length === 0
            )
          ) {
            return db().getItemIdsByReactionTemplate(
              consumes,
              produces,
              typeTags,
              reversible,
              set,
            );
          } else {
            return [];
          }
        },
      ),
    );

    const csIds = new Set(csIdsNested.flat());
    const csHeadings = await db().getItemHeadings(Array.from(csIds), {
      // FIXME: This is a magic value, maybe use PAGE_SIZE?
      count: 100,
      offset,
    });
    res.json(csHeadings);
  })
  .handler();

export default handler;
