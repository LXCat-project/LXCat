// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArangoDBContainer } from "@testcontainers/arangodb";
import { aql, Database } from "arangojs";
import { Wait } from "testcontainers";
import { PortWithOptionalBinding } from "testcontainers/build/utils/port.js";
import { loadTestUserAndOrg } from "./auth/testutils.js";
import { LXCatDatabase } from "./lxcat-database.js";
import { setupCompositionCollections } from "./setup/composition.js";
import { setupCrossSectionCollections } from "./setup/cs.js";
import { setupSharedCollections } from "./setup/shared.js";
import { setupUserCollections } from "./setup/users.js";
import { setSystemDb } from "./system-db.js";

export async function startDbContainer(
  password = "testpw",
  port: PortWithOptionalBinding = 8529,
) {
  const dbImage = "arangodb/arangodb:3.12.0";
  const container = await new ArangoDBContainer(dbImage, password)
    .withExposedPorts(port)
    .withWaitStrategy(Wait.forLogMessage("is ready for business. Have fun"))
    .start();
  const stream = await container.logs();
  stream
    .on("data", console.log)
    .on("err", console.error)
    .on("end", () => console.log("Stream closed"));
  const url = container.getHttpUrl();

  setSystemDb(url, password);

  process.env.ARANGO_URL = url;
  process.env.ARANGO_ROOT_PASSWORD = password;

  return async () => {
    await container.stop();
  };
}

export class LXCatTestDatabase extends LXCatDatabase {
  static async createTestInstance(system: Database, name: string) {
    const db = await system.createDatabase(name);

    await Promise.all([
      setupUserCollections(db),
      setupSharedCollections(db),
      setupCompositionCollections(db),
      setupCrossSectionCollections(db),
    ]);

    return new LXCatTestDatabase(db);
  }

  public async printCS() {
    const cursor = await this.db.query(aql`FOR cs IN CrossSection RETURN cs`);

    return cursor.all();
  }

  public async setupTestUser() {
    const testKeys = await loadTestUserAndOrg(this);
    return this.toggleRole(testKeys.testUserKey, "author");
  }

  public getDB() {
    return this.db;
  }
}
