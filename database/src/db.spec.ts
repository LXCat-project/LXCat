import { StartedArangoContainer } from "testcontainers";
import { db } from "./db";
import { startDbContainer } from "./testutils";

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
