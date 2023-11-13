// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArangoDBContainer } from "@testcontainers/arangodb";
import { Database } from "arangojs";
import { Wait } from "testcontainers";
import { PortWithOptionalBinding } from "testcontainers/build/utils/port";
import { loadTestUserAndOrg } from "./auth/testutils";
import { LXCatDatabase } from "./lxcat-database";
import { setupUserCollections } from "./setup/2_users";
import { setupSharedCollections } from "./setup/3_shared";
import { setupCrossSectionCollections } from "./setup/4_cs";
import { setSystemDb } from "./systemDb";

export async function startDbContainer(
  password = "testpw",
  port: PortWithOptionalBinding = 8529,
) {
  const dbImage = "arangodb/arangodb:3.11.0";
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
  process.env.ARANGO_PASSWORD = password;

  return async () => {
    await container.stop();
  };
}

export class LXCatTestDatabase extends LXCatDatabase {
  static async createTestInstance(system: Database, name: string) {
    const db = await system.createDatabase(name);

    await setupUserCollections(db);
    await setupSharedCollections(db);
    await setupCrossSectionCollections(db);

    return new LXCatTestDatabase(db);
  }

  public async setupTestUser() {
    const testKeys = await loadTestUserAndOrg(this.db);
    return this.toggleRole(testKeys.testUserKey, "author");
  }

  public getDB() {
    return this.db;
  }
}
