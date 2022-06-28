import { ArangoDBContainer } from "testcontainers";
import { PortWithOptionalBinding } from "testcontainers/dist/port";
import { setDb } from "./db";
import { setSystemDb, systemDb } from "./systemDb";

export async function startDbContainer(password="testpw", port: PortWithOptionalBinding=8529) {
  const dbImage = "arangodb/arangodb:3.9.1";
  const container = await new ArangoDBContainer(dbImage, password)
    .withExposedPorts(port)
    .start();
  const url = container.getHttpUrl();
  setSystemDb(url, password);
  await systemDb().createDatabase("lxcat");
  setDb(url, password);
  return async () => {
    await container.stop();
  };
}
