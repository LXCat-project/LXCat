import { Dict } from "@lxcat/schema/dist/core/util";
import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { beforeAll, describe, expect, it } from "vitest";
import { toggleRole } from "../../auth/queries";
import { createAuthCollections, loadTestUserAndOrg } from "../../auth/testutils";
import { createCsCollections, deepClone, ISO_8601_UTC } from "../../css/queries/testutils";
import { insert_state_dict } from "../../shared/queries";
import { startDbContainer } from "../../testutils";
import { insert_cs_with_dict, publish, updateSection } from "./write";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { byOwnerAndId, getVersionInfo } from "./author_read";

describe('insert_cs_with_dict()', () => {
    beforeAll(async () => {
        // TODO now 2 containers are started, starting container is slow so try to reuse container
        const stopContainer = await startDbContainer();
        await createAuthCollections();
        await createCsCollections();
        const testKeys = await loadTestUserAndOrg();
        await toggleRole(testKeys.testUserKey, "author");
        return stopContainer;
      });

    describe('given 4 states and zero references exist', () => {
        let state_ids: Dict<string>
        beforeAll(async () => {
            const states = {
                s1: {
                  particle: 'A',
                  charge: 0
                },
                s2: {
                  particle: 'B',
                  charge: 1
                },
                s3: {
                  particle: 'C',
                  charge: 2
                },
                s4: {
                  particle: 'D',
                  charge: 3
                },
              }
            state_ids = await insert_state_dict(states);
        })

        describe('create published cross section', () => {
            let keycs1: string
            beforeAll(async () => {
                const cs: CrossSection<string, string> = {
                    reaction: {
                        lhs: [
                          { count: 1, state: 's1' },
                        ],
                        rhs: [
                          { count: 1, state: 's2' },
                        ],
                        reversible: false,
                        type_tags: []
                      },
                      threshold: 42,
                      type: Storage.LUT,
                      labels: ["Energy", "Cross Section"],
                      units: ["eV", "m^2"],
                      data: [
                        [1, 3.14e-20],
                      ],
                      reference: []
                }
                const idcs1 = await insert_cs_with_dict(
                    cs,
                    state_ids,
                    {},
                    'Some organization'
                )
                keycs1 = idcs1.replace('CrossSection/', '')
            })

            it('should have published status', async () => {
                const info = await getVersionInfo(keycs1)
                const expected = {
                    status: 'published',
                    version: '1',
                    createdOn: expect.stringMatching(ISO_8601_UTC),
                    commitMessage: ''
                }
                expect(info).toEqual(expected)
            })

            describe('create draft from published cross section with changed data', () => {
                let keycs2
                beforeAll(async () => {
                    const publishedcs = await byOwnerAndId("somename@example.com", keycs1)
                    if (publishedcs === undefined) {
                        throw Error(`Unable to retrieve cross section with id ${keycs1}`)
                    }
                    const draftcs = deepClone(publishedcs)
                    draftcs.data = [
                        [1000, 1.2345e-20],
                      ]
                    
                    keycs2 = await updateSection(keycs1, draftcs, 'My first update')
                })

                it('should have draft status', async () => {
                    const info = await getVersionInfo(keycs2)
                    const expected = {
                        status: 'draft',
                        version: '2',
                        createdOn: expect.stringMatching(ISO_8601_UTC),
                        commitMessage: 'My first update'
                    }
                    expect(info).toEqual(expected)
                })
            })
        })

        describe('create draft cross section', () => {
            let keycs1: string
            beforeAll(async () => {
                const cs: CrossSection<string, string> = {
                    reaction: {
                        lhs: [
                          { count: 1, state: 's1' },
                        ],
                        rhs: [
                          { count: 1, state: 's2' },
                        ],
                        reversible: false,
                        type_tags: []
                      },
                      threshold: 42,
                      type: Storage.LUT,
                      labels: ["Energy", "Cross Section"],
                      units: ["eV", "m^2"],
                      data: [
                        [1, 3.14e-20],
                      ],
                      reference: []
                }
                const idcs1 = await insert_cs_with_dict(
                    cs,
                    state_ids,
                    {},
                    'Some organization',
                    'draft',
                )
                keycs1 = idcs1.replace('CrossSection/', '')
            })

            it('should have draft status', async () => {
                const info = await getVersionInfo(keycs1)
                const expected = {
                    status: 'draft',
                    version: '1',
                    createdOn: expect.stringMatching(ISO_8601_UTC),
                    commitMessage: ''
                }
                expect(info).toEqual(expected)
            })

            describe('given draft cross section is published', () => {
                beforeAll(async () => {
                    await publish(keycs1)
                })

                it('should have published status', async () => {
                    const info = await getVersionInfo(keycs1)
                    const expected = {
                        status: 'published',
                        version: '1',
                        createdOn: expect.stringMatching(ISO_8601_UTC),
                        commitMessage: ''
                    }
                    expect(info).toEqual(expected)
                })
            })
        })
    })
})