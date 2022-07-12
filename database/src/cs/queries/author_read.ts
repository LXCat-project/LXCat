import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { VersionInfo } from "../../shared/types/version_info";
import { db } from "../../db";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";

export async function getVersionInfo(key: string) {
    const cursor: ArrayCursor<VersionInfo> = await db().query(aql`
      FOR cs IN CrossSection
          FILTER cs._key == ${key}
          RETURN cs.versionInfo
    `);
    return cursor.next();
  }

  export async function byOwnerAndId(email: string, id: string) {
    const cursor: ArrayCursor<CrossSection<string, string>> = await db().query(aql`
    FOR u IN users
    FILTER u.email == ${email}
    FOR m IN MemberOf
        FILTER m._from == u._id
        FOR o IN Organization
            FILTER m._to == o._id
            FOR cs IN CrossSection
                FILTER cs.organization == o._id
                FILTER cs._key == ${id}
                FILTER ['published' ,'draft', 'retracted'] ANY == cs.versionInfo.status
                RETURN UNSET(cs, ["_key", "_rev", "_id", "versionInfo", "organization"])
      `);
    return await cursor.next();
  }