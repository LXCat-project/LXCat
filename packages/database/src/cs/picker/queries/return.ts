// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql, AqlLiteral } from "arangojs/aql";
import { ReactionFunction } from "../types";

export const returnTypeTags: ReactionFunction = (reaction: AqlLiteral) =>
  aql`RETURN ${reaction}.type_tags`;

export const returnReversible: ReactionFunction = (reaction: AqlLiteral) =>
  aql`RETURN ${reaction}.reversible`;

export const returnId: ReactionFunction = (reaction: AqlLiteral) =>
  aql`RETURN ${reaction}._id`;

export const returnCSId =
  (setIds: Array<string>): ReactionFunction =>
  (reaction: AqlLiteral) =>
    setIds.length === 0
      ? aql`
      FOR cs IN CrossSection
        FILTER cs.reaction == ${reaction}._id
	RETURN cs._id`
      : aql`
      FOR cs IN CrossSection
        FILTER cs.reaction == ${reaction}._id
	LET csId = FIRST(
	  FOR css IN OUTBOUND cs IsPartOf
	  FILTER css._id IN ${setIds}
	  RETURN cs._id
	)
	FILTER csId != null
	RETURN csId`;

export const returnCSSet: ReactionFunction = (reaction: AqlLiteral) =>
  aql`FOR cs IN CrossSection
        FILTER cs.reaction == ${reaction}._id
        FOR css IN OUTBOUND cs IsPartOf
          RETURN DISTINCT {id: css._id, organization: css.organization}
      `;

export const returnCrossSectionHeading =
  (setIds: Array<string>, produced: AqlLiteral, consumed: AqlLiteral) =>
  (reaction: AqlLiteral) =>
    aql`
    FOR cs IN CrossSection
      FILTER cs.reaction == reaction._id
      LET sets = (
        FOR css IN OUTBOUND cs IsPartOf
          ${setIds.length > 0 ? aql`FILTER css._id IN ${setIds}` : aql``}
          RETURN {id: css._id, name: css.name}
      )
      FILTER LENGTH(sets) > 0
      RETURN {
        id: cs._id, 
        organization: cs.organization,
        isPartOf: sets,
        reaction: {
          lhs: ${consumed}, 
          rhs: ${produced}, 
          reversible: ${reaction}.reversible, 
          type_tags: ${reaction}.type_tags
        },
        reference: []
      }
   `;
