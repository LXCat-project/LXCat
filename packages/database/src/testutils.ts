// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArangoDBContainer, Wait } from "testcontainers";
import { PortWithOptionalBinding } from "testcontainers/dist/port";
import { setDb } from "./db";
import { setSystemDb, systemDb } from "./systemDb";

export async function startDbContainer(
  password = "testpw",
  port: PortWithOptionalBinding = 8529
) {
  const dbImage = "arangodb/arangodb:3.9.1";
  const container = await new ArangoDBContainer(dbImage, password)
    .withExposedPorts(port)
    .withWaitStrategy(Wait.forLogMessage("is ready for business. Have fun"))
    .start();
  const stream = await container.logs();
  stream
    .on("data", (line) => console.log(line))
    .on("err", (line) => console.error(line))
    .on("end", () => console.log("Stream closed"));
  const url = container.getHttpUrl();
  setSystemDb(url, password);
  await systemDb().createDatabase("lxcat");
  setDb(url, password);
  return async () => {
    await container.stop();
  };
}
