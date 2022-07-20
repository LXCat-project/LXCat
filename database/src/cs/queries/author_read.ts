import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { VersionInfo } from "../../shared/types/version_info";
import { db } from "../../db";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { CrossSectionItem } from "../public";

export async function getVersionInfo(key: string) {
  const cursor: ArrayCursor<VersionInfo> = await db().query(aql`
      FOR cs IN CrossSection
          FILTER cs._key == ${key}
          RETURN cs.versionInfo
    `);
  return cursor.next();
}

export async function listOwned(email: string) {
  const cursor: ArrayCursor<CrossSectionItem> = await db().query(aql`
		FOR u IN users
			FILTER u.email == ${email}
			FOR m IN MemberOf
				FILTER m._from == u._id
				FOR o IN Organization
					FILTER m._to == o._id
					FOR cs IN CrossSection
						FILTER cs.organization == o._id
						FILTER ['published' ,'draft', 'retracted'] ANY == cs.versionInfo.status
            LET with_draft = FIRST(
                FILTER cs.versionInfo.status == 'published'
                RETURN COUNT(
                    FOR cs_draft IN INBOUND cs CrossSectionHistory
                        LIMIT 1
                        return 1
                )
            )
            FILTER with_draft != 1
						LET sets = (
							FOR i IN IsPartOf
							FILTER i._from == cs._id
							FOR css IN CrossSectionSet
								FILTER i._to == css._id
								RETURN { name: css.name, id: css._key, versionInfo: { version: css.versionInfo.version}}
						)
						LET reaction = FIRST(
							FOR r in Reaction
								FILTER r._id == cs.reaction
								LET consumes = (
									FOR c IN Consumes
									FILTER c._from == r._id
										FOR c2s IN State
										FILTER c2s._id == c._to
										RETURN {state: UNSET(c2s, ["_key", "_rev", "_id"]), count: c.count}
								)
								LET produces = (
									FOR p IN Produces
									FILTER p._from == r._id
										FOR p2s IN State
										FILTER p2s._id == p._to
										RETURN {state: UNSET(p2s, ["_key", "_rev", "_id"]), count: p.count}
								)
								RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes}, {"rhs": produces})
						)
            LET reference = (
              FOR rs IN References
                  FILTER rs._from == cs._id
                  FOR r IN Reference
                      FILTER r._id == rs._to
                      RETURN UNSET(r, ["_key", "_rev", "_id"])
              )
            SORT cs.versionInfo.createdOn DESC
            RETURN MERGE(UNSET(cs, ["_key", "_rev", "_id"]), {"id": cs._key, organization: o.name, "isPartOf": sets, reaction, reference})
	`);
  return await cursor.all();
}

export async function byOwnerAndId(email: string, id: string) {
  const cursor: ArrayCursor<CrossSection<string, string>> = await db()
    .query(aql`
    FOR u IN users
    FILTER u.email == ${email}
    FOR m IN MemberOf
        FILTER m._from == u._id
        FOR o IN Organization
            FILTER m._to == o._id
            FOR cs IN CrossSection
                FILTER cs.organization == o.name
                FILTER cs._key == ${id}
                FILTER ['published' ,'draft', 'retracted'] ANY == cs.versionInfo.status
                LET reference = (
                  FOR rs IN References
                      FILTER rs._from == cs._id
                      FOR r IN Reference
                          FILTER r._id == rs._to
                          RETURN r._key
                  )
                LET reaction = FIRST(
                  FOR r in Reaction
                      FILTER r._id == cs.reaction
                      LET consumes2 = (
                          FOR c IN Consumes
                          FILTER c._from == r._id
                              FOR c2s IN State
                              FILTER c2s._id == c._to
                              RETURN {state: c2s._key, count: c.count}
                      )
                      LET produces2 = (
                          FOR p IN Produces
                          FILTER p._from == r._id
                              FOR p2s IN State
                              FILTER p2s._id == p._to
                              RETURN {state: p2s._key, count: p.count}
                      )
                      RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes2}, {"rhs": produces2})
                )
                RETURN MERGE(UNSET(cs, ["_key", "_rev", "_id", "versionInfo", "organization"]), { reaction, reference })
      `);
  return await cursor.next();
}

export async function byOrgAndId(org: string, key: string) {
  const cursor: ArrayCursor<CrossSection<string, string>> = await db()
    .query(aql`
        FOR o IN Organization
            FILTER o.name == ${org}
            FOR cs IN CrossSection
                FILTER cs.organization == o._id
                FILTER cs._key == ${key}
                FILTER ['published' ,'draft', 'retracted'] ANY == cs.versionInfo.status
                LET reference = (
                  FOR rs IN References
                      FILTER rs._from == cs._id
                      FOR r IN Reference
                          FILTER r._id == rs._to
                          RETURN r._key
                  )
                LET reaction = FIRST(
                  FOR r in Reaction
                      FILTER r._id == cs.reaction
                      LET consumes2 = (
                          FOR c IN Consumes
                          FILTER c._from == r._id
                              FOR c2s IN State
                              FILTER c2s._id == c._to
                              RETURN {state: c2s._key, count: c.count}
                      )
                      LET produces2 = (
                          FOR p IN Produces
                          FILTER p._from == r._id
                              FOR p2s IN State
                              FILTER p2s._id == p._to
                              RETURN {state: p2s._key, count: p.count}
                      )
                      RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes2}, {"rhs": produces2})
              )
                RETURN MERGE(UNSET(cs, ["_key", "_rev", "_id", "versionInfo", "organization"]), { reaction, reference })
      `);
  return await cursor.next();
}
