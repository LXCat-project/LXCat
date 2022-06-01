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
    .ensureIndex({ type: "persistent", fields: ["name"], unique: true });
  await db
    .collection("Organization")
    .saveAll([{ _key: "1", name: "University X" }]);

  // Which Users are members of which Organization
  await db.createEdgeCollection("MemberOf");
  await db.collection("MemberOf").saveAll([
    {
      _from: "User/1",
      _to: "Organization/1",
    },
    {
      _from: "User/2",
      _to: "Organization/1",
    },
    {
      _from: "User/3",
      _to: "Organization/1",
    },
  ]);

  await db.createCollection("Reaction");
  await db.collection("Reaction").saveAll([
    {
      _key: "1",
      name: "Some reaction",
    },
    {
      _key: "2",
      name: "Some other reaction",
    },
  ]);

  // To focus on versioning, the following tables have been ommited in this test db
  // Consumes, HasCS, HasDirectSubState, InCompound, Particle, Produces,
  // Reference, References, State
  // TODO Those tables need be included in actual db

  await db.createCollection("CrossSection", {
    schema: {
      rule: {
        type: "object",
        properties: {
          reaction: {
            type: "string", // A key in Reaction collection
          },
          data: {
            type: "string",
          },
          versionInfo: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ['draft', 'published', 'archived', 'retracted'],
                default: 'draft'
              },

              version: {
                type: "string", // The version of this document
              },
              createdOn: {
                type: "string", // Date on which document was created. as ISO8601 formatted string
              },
              commitMessage: {
                type: "string", // Description of what was changed since previous version.
              },
              retractMessage: {
                type: "string", // Description why item was retracted.
              },
            },
            required: ["status", "version", "createdOn"],
          },
        },
      },
    },
  });
  await db
    .collection("CrossSection")
    .ensureIndex({ type: "persistent", fields: ["reaction"] });
  await db
    .collection("CrossSection")
    .ensureIndex({ type: "persistent", fields: ["organization"] });
  await db
    .collection("CrossSection")
    .ensureIndex({ type: "persistent", fields: ["versionInfo.status"] });
  for (let index = 0; index < 1000; index++) {
    await db.collection("CrossSection").saveAll([
      { // Initial version
        _key: `${index*4+1}`,
        reaction: "Reaction/1",  // Replaces HasCS colllection, as section can only be have single reaction
        data: "some data",
        organization: 'Organization/1',
        versionInfo: {
          status: 'archived',
          version: "1",
          createdOn: '2000-01-01T00:00:00Z',
          commitMessage: "Initial message",
        },
      },
      { // Second version
        _key: `${index*4+2}`,
        reaction: "Reaction/1",
        data: "some data slightly different data",
        organization: 'Organization/1',
        versionInfo: {
          status: 'archived',
          version: "2",
          createdOn: '2000-01-02T00:00:00Z',
          commitMessage: "Some message",
        },
      },
      { // Published version
        _key: `${index*4+3}`,
        reaction: "Reaction/1",
        data: "some data slightly different data",
        organization: 'Organization/1',
        versionInfo: {
          status: 'published',
          version: "3",
          createdOn: '2000-01-03T00:00:00Z',
          commitMessage: "Some message",
        },
      },
      { // Draft version
        _key: `${index*4+4}`,
        reaction: "Reaction/1",
        data: "some data slightly different data",
        organization: 'Organization/1',
        versionInfo: {
          status: 'draft',
          version: "4",
          createdOn: '2000-01-03T00:00:00Z',
          commitMessage: "Some message",
        },
      },
    ]);
  }

  // Which Cross sections are part of which Cross section set
  await db.createEdgeCollection("CrossSectionHistory");
  // TODO have check so a crosssection can only be in sets from same organization
  for (let index = 0; index < 1000; index++) {
  await db.collection("CrossSectionHistory").saveAll([
    {
      _from: `CrossSection/${index*4+4}`,
      _to: `CrossSection/${index*4+3}`,
    },
    {
      _from: `CrossSection/${index*4+3}`,
      _to: `CrossSection/${index*4+2}`,
    },
    {
      _from: `CrossSection/${index*4+2}`,
      _to: `CrossSection/${index*4+1}`,
    },
  ]);
}

  await db.createCollection("CrossSectionSet", {
    schema: {
      rule: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          organization: {
            type: "string", // A key in Organization collection
          },
          versionInfo: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ['draft', 'published', 'archived', 'retracted'],
                default: 'draft'
              },
              version: {
                type: "string", // The version of this document
              },
              createdOn: {
                type: "string", // Date on which document was created. as ISO8601 formatted string
              },
              commitMessage: {
                type: "string", // Description of what was changed since previous version.
              },
              restractMessage: {
                type: "string", // Description why item was retracted.
              },
            },
            required: ["status", "version", "createdOn"],
          },
        },
        // TODO should set have own references?
      },
    },
  });
  await db
    .collection("CrossSectionSet")
    .ensureIndex({ type: "persistent", fields: ["organization"] });
  await db.collection("CrossSectionSet").saveAll([
    { // Published version
      _key: "1",
      name: "Some set name",
      organization: "Organization/1", // Replaces Provides colllection, as set can only be owned by single organization
      versionInfo: {
        status: "published",
        version: "1",
        createdOn: "2000-01-03T00:00:00Z",
        commitMessage: "Some message",
      },
    },
    { // Draft version
      _key: "2",
      name: "Some other set name",
      organization: "Organization/1", // Replaces Provides colllection, as set can only be owned by single organization
      versionInfo: {
        status: "draft",
        version: "2",
        createdOn: "2001-01-03T00:00:00Z",
        commitMessage: "Some message",
      },
    },
  ]);

  // Which Cross sections are part of which Cross section set
  await db.createEdgeCollection("CrossSectionSetHistory");
  // TODO have check so a crosssection can only be in sets from same organization
  await db.collection("CrossSectionSetHistory").saveAll([
    {
      _from: "CrossSectionSet/2",
      _to: "CrossSectionSet/1",
    },
  ]);

  // Which Cross sections are part of which Cross section set
  await db.createEdgeCollection("IsPartOf");
  // TODO have check so a crosssection can only be in sets from same organization
  await db.collection("IsPartOf").saveAll([
    {
      _from: "CrossSection/3",
      _to: "CrossSectionSet/1",
    },
    {
      _from: "CrossSection/3", // Draft set can have published section
      _to: "CrossSectionSet/2",
    },
    {
      _from: "CrossSection/8", // Draft set can have draft section
      _to: "CrossSectionSet/2",
    }
  ]);
})();
