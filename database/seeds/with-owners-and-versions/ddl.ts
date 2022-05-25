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
        reaction: "Reaction/1",
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
  await db
    .collection("CrossSectionSet")
    .ensureIndex({ type: "persistent", fields: ["versionInfo.previous"] });
  await db.collection("CrossSectionSet").saveAll([
    {
      _key: "1",
      name: "Some set name",
      organization: "Organization/1", // Replaces Provides colllection, as set can only be owned by single organization
      versionInfo: {
        status: "published",
        version: "2",
        createdOn: "2000-01-03T00:00:00Z",
        commitMessage: "Some message",
      },
    },
  ]);

  // Which Cross sections are part of which Cross section set
  await db.createEdgeCollection("CrossSectionSetHistory");
  // TODO have check so a crosssection can only be in sets from same organization
  await db.collection("CrossSectionSetHistory").saveAll([
  ]);

  // Which Cross sections are part of which Cross section set
  await db.createEdgeCollection("IsPartOf");
  // TODO have check so a crosssection can only be in sets from same organization
  await db.collection("IsPartOf").saveAll([
    {
      _from: "CrossSection/3",
      _to: "CrossSectionSet/1",
    }
  ]);

  //   // Sets can be worked on in admin interface without being visible on public site
  //   // They need to be copied and normalized to become an entry in CrossSectionSet collection
  //   await db.createCollection("CrossSectionSetPrivate");
  //   await db.collection("CrossSectionSetPrivate").saveAll([
  //     // A new set
  //     {
  //       _id: "CrossSectionSetPrivate/1",
  //       name: "Some set name",
  //       organization: {
  //         name: "University X",
  //       },
  //       processes: [
  //         {
  //           data: "some data",
  //           reaction: {
  //             name: "Some reaction",
  //           },
  //         },
  //         {
  //           data: "some other data",
  //           reaction: {
  //             name: "Some other reaction",
  //           },
  //         },
  //       ],
  //     },
  //     // A updated set, needs to know from which set it is a update from
  //     {
  //       _id: "CrossSectionSetPrivate/2",
  //       _from: "CrossSectionSet/1",
  //       name: "Some set name",
  //       organization: {
  //         name: "University X",
  //       },
  //       processes: [
  //         {
  //           data: "some data",
  //           reaction: {
  //             name: "Some reaction",
  //           },
  //         },
  //         {
  //           data: "some other data",
  //           reaction: {
  //             name: "Some other reaction",
  //           },
  //         },
  //       ],
  //     },
  //   ]);

  //   await db.createCollection("CrossSectionSetArchive");
  //   await db
  //     .collection("CrossSection")
  //     .ensureIndex({ type: "persistent", fields: ["current"] });
  //   await db.collection("CrossSectionSetArchive").saveAll([
  //     {
  //       _id: "CrossSectionSetArchive/1",
  //       versionInfo: {
  //         current: "CrossSectionSet/1",
  //         version: "1",
  //         createdOn: "Some date",
  //         commitMessage: "Some message",
  //       },
  //       name: "Some set name",
  //       organization: {
  //         name: "University X",
  //       },
  //       processes: [
  //         {
  //           data: "some data with a typo",
  //           reaction: {
  //             name: "Some reaction",
  //           },
  //         },
  //         {
  //           data: "some other data",
  //           reaction: {
  //             name: "Some other reaction",
  //           },
  //         },
  //       ],
  //     },
  //     // Retracted items are stored in this collection with a retract message
  //     {
  //       _id: "CrossSectionSetArchive/1",
  //       versionInfo: {
  //         current: "CrossSectionSet/2", // ID of css that was present in CrossSectionSet collection before it was deleted
  //         version: "1",
  //         createdOn: "Some date",
  //         retractMessage: "Some message why set was retracted",
  //       },
  //       name: "Some set name",
  //       organization: {
  //         name: "University X",
  //       },
  //       processes: [
  //         {
  //           data: "some data with a typo",
  //           reaction: {
  //             name: "Some reaction",
  //           },
  //         },
  //         {
  //           data: "some other data",
  //           reaction: {
  //             name: "Some other reaction",
  //           },
  //         },
  //       ],
  //     },
  //   ]);

  //   // When a set is updated then any changed cross sections will also get a new version
  //   // The previous version is stored in the CrossSectionArchive collection
  //   // and new version will be in CrossSection + other child collections
  //   await db.createCollection("CrossSectionArchive");
  //   await db.collection("CrossSectionArchive").saveAll([
  //     {
  //       _id: "CrossSectionArchive/1",
  //       versionInfo: {
  //         current: "CrossSection/1",
  //         version: "1",
  //         createdOn: "Some date",
  //         commitMessage: "Some message",
  //       },
  //       data: "some data with a typo",
  //       reaction: {
  //         name: "Some reaction",
  //       },
  //     },
  //     // Retracted items are stored in this collection with a retract message
  //     {
  //       _id: "CrossSectionArchive/1",
  //       versionInfo: {
  //         current: "CrossSection/2", // ID of cs that was present in CrossSection collection before it was deleted
  //         version: "1",
  //         createdOn: "Some date",
  //         retractMessage: "Some message explaining why cs was restracted.",
  //       },
  //       data: "some data with a typo",
  //       reaction: {
  //         name: "Some reaction",
  //       },
  //     },
  //   ]);
})();
