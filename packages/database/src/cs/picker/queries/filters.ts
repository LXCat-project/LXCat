// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { type ReactionTypeTag } from "@lxcat/schema/process";
import { aql, AqlLiteral } from "arangojs/aql";
import { ReactionFunction, Reversible } from "../types.js";

export const getTypeTagFilterAQL =
  (typeTags: Array<ReactionTypeTag>): ReactionFunction =>
  (reaction: AqlLiteral) =>
    typeTags.length === 0
      ? aql``
      : aql`FILTER ${reaction}.typeTags ANY IN ${typeTags}`;

export const getReversibleFilterAQL =
  (reversible: Reversible): ReactionFunction => (reaction: AqlLiteral) =>
    reversible === Reversible.Both
      ? aql``
      : aql`FILTER ${reaction}.reversible == ${
        reversible === Reversible.False ? false : true
      }`;

export const getCSSetFilterAQL =
  (setIds: Array<string>): ReactionFunction => (reaction: AqlLiteral) =>
    aql`LET inSet = COUNT(
          FOR cs IN CrossSection
            FILTER cs.reaction == ${reaction}._id
            FOR css IN OUTBOUND cs IsPartOf
              FILTER css.versionInfo.status == "published"
	            ${setIds.length === 0 ? aql`` : aql`FILTER css._id IN ${setIds}`}
              LIMIT 1
              RETURN 1
        )
        FILTER inSet > 0`;
