import { ArangoDBContainer, StartedArangoContainer } from "testcontainers";
import { db, setDb } from "./db";
import { setSystemDb, systemDb } from "./systemDb";

describe("given running ArangoDB container with empty lxcat database", () => {
  jest.setTimeout(180_000);

  let container: StartedArangoContainer;
  beforeAll(async () => {
    container = await startDbContainer();
  });

  afterAll(async () => {
    await container.stop();
  });

  it("should be pingable", async () => {
    const result = await db().version();
    expect(result).toMatchObject({
      license: "community",
      server: "arango",
      version: expect.stringMatching(/\d+\.\d+\.\d+/),
    });
  });
});

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
