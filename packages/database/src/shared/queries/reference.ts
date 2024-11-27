// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";

import { Reference } from "@lxcat/schema";
import { LXCatDatabase } from "../../lxcat-database.js";
import { Bibliography } from "../types/bibliography.js";

export async function getReferences(
  this: LXCatDatabase,
  ids: Array<string>,
): Promise<Array<Reference>> {
  const cursor: ArrayCursor<Reference> = await this.db.query(aql`
            FOR ref IN Reference
              FILTER ref._key IN ${ids}
              RETURN UNSET(ref, ["_key", "_id", "_rev"])
        `);
  return cursor.all();
}

export async function getReferencesForSelection(
  this: LXCatDatabase,
  ids: Array<string>,
): Promise<Bibliography> {
  const cursor: ArrayCursor<Bibliography> = await this.db.query(aql`
    LET sets = (
      FOR css IN CrossSectionSet
        FILTER css.versionInfo.status != 'draft'
        FOR cs IN INBOUND css IsPartOf
          FILTER cs._key IN ${ids}
          FILTER cs.versionInfo.status != 'draft'
          LIMIT 1
          RETURN {id: css._key, name: css.name, organization: DOCUMENT(css.organization).name, publishedIn: SPLIT(css.publishedIn, '/')[1]}
    )
    LET processes = (
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        LET references = (
          FOR r IN OUTBOUND cs References
            RETURN r._key
        )
        RETURN {id: cs._key, references}
    )
    LET referenceIds = APPEND(sets[*].publishedIn, FLATTEN(processes[*].references), true)

    LET references = MERGE(
      FOR r IN Reference
        FILTER r._key IN referenceIds
        RETURN {[r._key]: UNSET(r, ["_key", "_id", "_rev"])}
    )

    RETURN {processes, sets, references}
    `);
  return cursor.next().then(bib => bib!);
}

export async function getReferenceKeyByDOI(this: LXCatDatabase, doi: string) {
  const cursor: ArrayCursor<string> = await this.db.query(aql`
            FOR ref IN Reference
              FILTER ref.DOI == ${doi}
              RETURN ref._key
        `);
  return cursor.next();
}
