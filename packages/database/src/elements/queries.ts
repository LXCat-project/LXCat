// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { VersionInfo } from "@lxcat/schema";
import { Element } from "@lxcat/schema/species";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { LXCatDatabase } from "../lxcat-database.js";

export async function getActiveElements(
  this: LXCatDatabase,
): Promise<Array<Element>> {
  const cursor: ArrayCursor<Element> = await this.db.query(aql`
    FOR elem IN Element
      LET hasSets = FIRST(
        FOR comp IN INBOUND elem ContainsElement
          FOR state IN State
            FILTER comp._id == state.detailed.composition
            FOR r IN INBOUND state Consumes, Produces
              FOR cs IN CrossSection
                FILTER cs.reaction == r._id
                FOR set IN OUTBOUND cs IsPartOf
                  FILTER set.versionInfo.status == "published"
                  RETURN 1
      )
      FILTER hasSets == 1
      RETURN elem._key
  `);

  return cursor.all();
}

export type PeriodicSearchResult = {
  _key: string;
  name: string;
  organization: string;
  complete: boolean;
  description: string;
  versionInfo: VersionInfo;
};

export async function getSetHeaderByElements(
  this: LXCatDatabase,
  elements: Array<Element>,
): Promise<Array<PeriodicSearchResult>> {
  const cursor: ArrayCursor<PeriodicSearchResult> = await this.db.query(
    aql`
      FOR set IN CrossSectionSet
       FILTER set.versionInfo.status == "published"

       LET isValid = FIRST(
         FOR cs IN INBOUND set IsPartOf
           FOR r IN Reaction
             FILTER cs.reaction == r._id
             FOR state IN OUTBOUND r Consumes, Produces
               FOR comp IN Composition
                 FILTER comp._id == state.detailed.composition
                 FOR elem IN OUTBOUND comp ContainsElement
                   FILTER elem._key IN ${elements}
                   RETURN 1
       )
       FILTER isValid == 1

       RETURN MERGE(UNSET(set, ["_id", "_rev", "publishedIn"]), {organization: DOCUMENT(set.organization).name})
    `,
  );

  return cursor.all();
}
