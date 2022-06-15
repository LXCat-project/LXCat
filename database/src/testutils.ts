import { ArangoDBContainer } from "testcontainers";
import { setDb } from "./db";
import { setSystemDb, systemDb } from "./systemDb";

export async function startDbContainer() {
  const dbImage = "arangodb/arangodb:3.9.1";
  const password = "testpw";
  const container = await new ArangoDBContainer(dbImage, password)
    .withExposedPorts(8529)
    .start();
  const url = container.getHttpUrl();
  setSystemDb(url, password);
  await systemDb().createDatabase("lxcat");
  setDb(url, password);
  return container;
}
