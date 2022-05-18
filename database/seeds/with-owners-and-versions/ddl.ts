/*
 * Run with
 *
 * npx ts-node seeds/with-owners-and-versions/ddl.ts
 */
import "dotenv/config";
import { systemDb } from "../../src/systemDb";

(async () => {
  const databaseName = "lxcatplus";

  await systemDb().dropDatabase(databaseName);
  await systemDb().createDatabase(databaseName);

  const db = systemDb().database(databaseName);

  await db.createCollection("User", {
    schema: {
      rule: {
        type: "object",
        properties: {
          email: {
            type: "string",
          },
        },
      },
    },
  });
  await db.collection("User").saveAll([
    {
      _key: "1",
      email: "someone@example.com",
    },
    {
      _key: "2",
      email: "someone2@example.com",
    },
    {
      _key: "3",
      email: "someone3@example.com",
    },
  ]);

  // Organization is called database in current lxcat and contributor in lxcat-ng
  await db.createCollection("Organization", {
    schema: {
      rule: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
      },
    },
  });
  await db
    .collection("Organization")
    .saveAll([{ _key: "1", name: "University X" }]);

  // Which Users are members of which Organization
  await db.createEdgeCollection("Membership");
  await db.collection("Membership").saveAll([
    {
      _to: "User/1",
      _from: "Organization/1",
    },
    {
      _to: "User/2",
      _from: "Organization/1",
    },
    {
      _to: "User/3",
      _from: "Organization/1",
    },
  ]);

  await db.createCollection("Reaction");
  await db.collection("Membership").saveAll([
    {
      _key: "1",
      name: "Some reaction",
    },
    {
      _key: "2",
      name: "Some other reaction",
    },
  ]);

  await db.createCollection("CrossSection", {
    schema: {
      rule: {
        type: "object",
        properties: {
          reaction: {
            type: "string", // id of item in reaction collection
          },
        },
      },
    },
  });
  await db
    .collection("CrossSection")
    .ensureIndex({ type: "persistent", fields: ["reaction"] }),
    await db.collection("CrossSection").saveAll([
      {
        _key: "1",
        reaction: "Reaction/1",
      },
      {
        _key: "2",
        reaction: "Reaction/2",
      },
    ]);

  await db.createCollection("CrossSectionSet", {
    schema: {
      rule: {
        type: "object",
        properties: {
          name: {
            type: "string",
          }
        },
      },
    },
  });
  await db.collection("CrossSectionSet").saveAll([
    {
      _key: "1",
      name: "Some set name",
    },
  ]);

  // Which Cross sections are part of which Cross section set
  await db.createEdgeCollection("IsPartOf");
  await db.collection("IsPartOf").saveAll([{
      _from: 'CrossSection/1',
      _to: 'CrossSectionSet/1'
  },{
      _from: 'CrossSection/2',
      _to: 'CrossSectionSet/1'
  }])

  // Which organization owns which cross section set
  await db.createEdgeCollection("BelongsTo");
  await db.collection("BelongsTo").saveAll([{
      _to: 'Organization/1',
      _from: 'CrossSectionSet/1'
  }])
})();
