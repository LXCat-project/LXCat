// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnySpecies, AnySpeciesSerializable } from "@lxcat/schema/species";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { beforeAll, describe, expect, it } from "vitest";
import {
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { systemDb } from "../../systemDb";
import { LXCatTestDatabase } from "../../testutils";
import { insertStateDict } from "../queries";
import { State } from "../types/collections";
import {
  ChoiceRow,
  generateStateChoicesAql,
  generateStateFilterAql,
  getIdByLabel,
  groupStateChoices,
  listStateChoices,
  listStates,
  StateChoices,
} from "./state";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(systemDb(), "delete-cs-test");
  await db.setupTestUser();

  return async () => systemDb().dropDatabase("delete-cs-test");
});

const makeStateInputs = (states: Array<[string, AnySpecies]>) =>
  Object.fromEntries(
    states.map(([key, state]) => [key, AnySpecies.parse(state)]),
  );

const sampleTwoParticlesTwoCharges = () =>
  makeStateInputs([
    ["H2", { type: "simple", particle: "H2", charge: 0 }],
    ["H2p", { type: "simple", particle: "H2", charge: 1 }],
    ["N2", { type: "simple", particle: "N2", charge: 0 }],
    ["N2p", { type: "simple", particle: "N2", charge: 1 }],
  ]);

describe.skip("generateStateFilterAql()", () => {
  describe("2 particles with each 2 different charges", () => {
    beforeAll(async () => {
      const states = sampleTwoParticlesTwoCharges();
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateChoices, string[]]> = [
      ["given empty selection", { particle: {} }, ["H2", "H2^+", "N2", "N2^+"]],
      [
        "given single unknown particle",
        { particle: { O2: { charge: {} } } },
        [],
      ],
      [
        "given single known particle",
        { particle: { H2: { charge: {} } } },
        ["H2", "H2^+"],
      ],
      [
        "given 2 known particles",
        { particle: { H2: { charge: {} }, N2: { charge: [] } } },
        ["H2", "H2^+", "N2", "N2^+"],
      ],
      [
        "given single known particle with single charge",
        { particle: { H2: { charge: { 0: { electronic: {} } } } } },
        ["H2"],
      ],
      [
        "given 2 known particles with single charge",
        {
          particle: {
            H2: {
              charge: {
                0: { electronic: {} },
              },
            },
            N2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
          },
        },
        ["H2", "N2"],
      ],
      [
        "given 2 known particles with different charge",
        {
          particle: {
            H2: {
              charge: {
                0: { electronic: {} },
              },
            },
            N2: {
              charge: {
                1: {
                  electronic: {},
                },
              },
            },
          },
        },
        ["H2", "N2^+"],
      ],
    ];
    it.each(testCases)("%s", searchState);
  });

  describe("2 states with different electronic", () => {
    beforeAll(async () => {
      const states = makeStateInputs([
        ["H2g", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: { energyId: "I", Lambda: 1, S: 0, parity: "g" },
        }],
        ["H2u", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: { energyId: "I", Lambda: 1, S: 0, parity: "u" },
        }],
      ]);
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateChoices, string[]]> = [
      [
        "just g",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {},
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g}"],
      ],
      [
        "g and u",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {},
                    },
                    "I^1P_u": {
                      vibrational: {},
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g}", "H2{I^1P_u}"],
      ],
    ];
    it.each(testCases)("%s", searchState);
  });

  describe("2 states with different vibrational", () => {
    beforeAll(async () => {
      const states = makeStateInputs([
        ["H2v0", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "I",
            Lambda: 1,
            S: 0,
            parity: "g",
            vibrational: { v: 0 },
          },
        }],
        ["H2v2", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "I",
            Lambda: 1,
            S: 0,
            parity: "g",
            vibrational: { v: 2 },
          },
        }],
      ]);
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateChoices, string[]]> = [
      [
        "just v=2",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {
                        "2": {
                          rotational: [],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g{v=2}}"],
      ],
      [
        "v=0 or v=2",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {
                        "0": {
                          rotational: [],
                        },
                        "2": {
                          rotational: [],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g{v=0}}", "H2{I^1P_g{v=2}}"],
      ],
    ];
    it.each(testCases)("%s", searchState);
  });

  describe("2 states with different rotational", () => {
    beforeAll(async () => {
      const states = makeStateInputs(
        [
          ["H2J1", {
            particle: "H2",
            charge: 0,
            type: "HomonuclearDiatom",
            electronic: {
              energyId: "I",
              Lambda: 1,
              S: 0,
              parity: "g",
              vibrational: {
                v: 0,
                rotational: {
                  J: 1,
                },
              },
            },
          }],
          ["H2J3", {
            particle: "H2",
            charge: 0,
            type: "HomonuclearDiatom",
            electronic: {
              energyId: "I",
              Lambda: 1,
              S: 0,
              parity: "g",
              vibrational: {
                v: 0,
                rotational: {
                  J: 3,
                },
              },
            },
          }],
        ],
      );
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateChoices, string[]]> = [
      [
        "just J=1",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {
                        "0": {
                          rotational: ["1"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g{v=0{J=1}}}"],
      ],
      [
        "J=1 and J=3",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {
                        "0": {
                          rotational: ["1", "3"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g{v=0{J=1}}}", "H2{I^1P_g{v=0{J=3}}}"],
      ],
    ];
    it.each(testCases)("%s", searchState);
  });

  describe("2 states with different compound electronic", () => {
    beforeAll(async () => {
      const states = makeStateInputs([
        ["H212", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: [
            {
              energyId: "I",
              Lambda: 1,
              S: 0,
              parity: "g",
            },
            {
              energyId: "I",
              Lambda: 2,
              S: 0,
              parity: "g",
            },
          ],
        }],
        ["H234", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: [
            {
              energyId: "I",
              Lambda: 3,
              S: 0,
              parity: "g",
            },
            {
              energyId: "I",
              Lambda: 4,
              S: 0,
              parity: "g",
            },
          ],
        }],
      ]);
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateChoices, string[]]> = [
      [
        "Lamba=1",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {},
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g}", "H2{I^1P_g|I^1D_g}"],
      ],
    ];
    it.each(testCases)("%s", searchState);
  });

  describe("2 states with different compound vibrational", () => {
    beforeAll(async () => {
      const states = makeStateInputs([
        ["H2v12", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "I",
            Lambda: 1,
            S: 0,
            parity: "g",
            vibrational: [
              {
                v: 1,
              },
              {
                v: 2,
              },
            ],
          },
        }],
        ["H2v34", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "I",
            Lambda: 1,
            S: 0,
            parity: "g",
            vibrational: [
              {
                v: 3,
              },
              {
                v: 4,
              },
            ],
          },
        }],
      ]);
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateChoices, string[]]> = [
      [
        "just v=1",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {
                        "1": {
                          rotational: [],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g{v=1}}", "H2{I^1P_g{v=1|2}}"],
      ],
      [
        "just v=1 or v=2",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {
                        "1": {
                          rotational: [],
                        },
                        "2": {
                          rotational: [],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g{v=1}}", "H2{I^1P_g{v=1|2}}", "H2{I^1P_g{v=2}}"],
      ],
      // TODO add test case for 1|2
      // TODO add test case for 1|2 and 3|4
      // TODO add test case for 1|3 should return nothing
    ];
    it.each(testCases)("%s", searchState);
  });

  describe("2 states with different compound rotational", () => {
    beforeAll(async () => {
      const states = makeStateInputs([
        ["H2J12", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "I",
            Lambda: 1,
            S: 0,
            parity: "g",
            vibrational: {
              v: 0,
              rotational: [
                {
                  J: 1,
                },
                {
                  J: 2,
                },
              ],
            },
          },
        }],
        ["H2J34", {
          particle: "H2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "I",
            Lambda: 1,
            S: 0,
            parity: "g",
            vibrational: {
              v: 0,
              rotational: [
                {
                  J: 3,
                },
                {
                  J: 4,
                },
              ],
            },
          },
        }],
      ]);
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateChoices, string[]]> = [
      [
        "just J=1",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {
                        "0": {
                          rotational: ["1"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ["H2{I^1P_g{v=0{J=1}}}", "H2{I^1P_g{v=0{J=1|2}}}"],
      ],
      [
        "J=1 or J=2",
        {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {
                    "I^1P_g": {
                      vibrational: {
                        "0": {
                          rotational: ["1", "2"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        [
          "H2{I^1P_g{v=0{J=1}}}",
          "H2{I^1P_g{v=0{J=1|2}}}",
          "H2{I^1P_g{v=0{J=2}}}",
        ],
      ],
      // TODO
      // [
      //   "J=1|2",
      //   {
      //     particle: {
      //       H2: {
      //         charge: {
      //           0: {
      //             electronic: {
      //               "I^1P_g": {
      //                 vibrational: {
      //                   "0": {
      //                     rotational: ["1|2"],
      //                   },
      //                 },
      //               },
      //             },
      //           },
      //         },
      //       },
      //     },
      //   },
      //   ["H2{I^1P_g{v=0{J=1|2}}}"],
      // ],
      // TODO add test case for 1|2
      // TODO add test case for 1|2 and 3|4
      // TODO add test case for 1|3 should return nothing
    ];
    it.each(testCases)("%s", searchState);
  });
});

describe.skip("generateStateChoicesAql() + groupStateChoices()", () => {
  const testCases: Array<
    {
      description: string;
      states: Record<string, AnySpeciesSerializable>;
      expected: StateChoices;
    }
  > = [
    {
      description: "2 simple particles with each 2 different charges",
      states: sampleTwoParticlesTwoCharges(),
      expected: {
        particle: {
          H2: {
            charge: {
              0: { electronic: {} },
              1: { electronic: {} },
            },
          },
          N2: {
            charge: {
              0: { electronic: {} },
              1: { electronic: {} },
            },
          },
        },
      },
    },
    {
      description: "2 with different rotational",
      states: makeStateInputs([
        ["N2a", {
          particle: "N2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "X",
            Lambda: 0,
            S: 0,
            parity: "g",
            reflection: "+",
            vibrational: { v: 0, rotational: { J: 1 } },
          },
        }],
        ["N2b", {
          particle: "N2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "X",
            Lambda: 0,
            S: 0,
            parity: "g",
            reflection: "+",
            vibrational: { v: 0, rotational: { J: 2 } },
          },
        }],
      ]),
      expected: {
        particle: {
          N2: {
            charge: {
              0: {
                electronic: {
                  "X^1S_g^+": {
                    vibrational: {
                      "0": {
                        rotational: ["1", "2"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      description: "1 particle with 2 vibrational",
      states: makeStateInputs([
        ["CO2", {
          particle: "CO2",
          charge: 0,
          type: "LinearTriatomInversionCenter",
          electronic: {
            energyId: "X",
            Lambda: 0,
            S: 0,
            parity: "g",
            reflection: "+",
            vibrational: [{ v: [0, 0, 0] }, { v: [1, 0, 1] }],
          },
        }],
      ]),
      expected: {
        particle: {
          CO2: {
            charge: {
              0: {
                electronic: {
                  "X^1S_g^+": {
                    vibrational: {
                      "0,0,0": {
                        rotational: [],
                      },
                      "1,0,1": {
                        rotational: [],
                      },
                      "0,0,0|1,0,1": {
                        rotational: [],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      description: "1 particle with 2 rotational",
      states: makeStateInputs([
        ["N2a", {
          particle: "N2",
          charge: 0,
          type: "HomonuclearDiatom",
          electronic: {
            energyId: "X",
            Lambda: 0,
            S: 0,
            parity: "g",
            reflection: "+",
            vibrational: { v: 0, rotational: [{ J: 1 }, { J: 2 }] },
          },
        }],
      ]),
      expected: {
        particle: {
          N2: {
            charge: {
              0: {
                electronic: {
                  "X^1S_g^+": {
                    vibrational: {
                      "0": {
                        rotational: ["1", "2", "1|2"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  ];
  describe.each(testCases)("$description", ({ states, expected }) => {
    beforeAll(async () => {
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    it("should return nested object", async () => {
      const choicesAql = generateStateChoicesAql();
      const cursor: ArrayCursor<ChoiceRow> = await db().query(aql`
        FOR s IN State
          ${choicesAql}
      `);
      const choiceRows = await cursor.all();
      const choices = groupStateChoices(choiceRows);
      expect(choices).toEqual(expected);
    });
  });
});

async function searchState(
  _description: string,
  selection: StateChoices,
  expected: string[],
) {
  const filter = generateStateFilterAql(selection);
  const cursor: ArrayCursor<string> = await db().query(aql`
        FOR s IN State
          FILTER ${filter}
          SORT s.id
          RETURN s.id
      `);
  const result = await cursor.all();

  expect(result).toEqual(expected);
}

describe.skip("listStates()", () => {
  describe("empty database", () => {
    describe("given empty selection", () => {
      it("should return empty result", async () => {
        const emptySelection = { particle: {} };
        const result = await listStates(emptySelection);
        const expected = {};
        expect(result).toEqual(expected);
      });
    });
  });

  describe.only("2 simple particles with 2 different charges", () => {
    beforeAll(async () => {
      const states = sampleTwoParticlesTwoCharges();
      await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateChoices, State[]]> = [
      ["given empty selection should return no data", { particle: {} }, []],
      [
        "given uncharged H2 selected should return H2 uncharged state",
        { particle: { H2: { charge: { "0": { electronic: {} } } } } },
        [
          {
            detailed: {
              type: "simple",
              particle: "H2",
              charge: 0,
            },
            serialized: {
              particle: "H2",
              charge: 0,
              summary: "H2",
              latex: "\\mathrm{H2}",
            },
          },
        ],
      ],
      [
        "given H2 selected should return H2 states",
        { particle: { H2: { charge: {} } } },
        [
          {
            detailed: {
              type: "simple",
              particle: "H2",
              charge: 0,
            },
            serialized: {
              particle: "H2",
              charge: 0,
              summary: "H2",
              latex: "\\mathrm{H2}",
            },
          },
          {
            detailed: {
              type: "simple",
              particle: "H2",
              charge: 1,
            },
            serialized: {
              particle: "H2",
              charge: 1,
              summary: "H2^+",
              latex: "\\mathrm{H2^+}",
            },
          },
        ],
      ],
      [
        "given H2 and N2 selected should return all states",
        { particle: { H2: { charge: {} }, N2: { charge: {} } } },
        [
          {
            detailed: {
              type: "simple",
              particle: "H2",
              charge: 0,
            },
            serialized: {
              particle: "H2",
              charge: 0,
              summary: "H2",
              latex: "\\mathrm{H2}",
            },
          },
          {
            detailed: {
              type: "simple",
              particle: "H2",
              charge: 1,
            },
            serialized: {
              particle: "H2",
              charge: 1,
              summary: "H2^+",
              latex: "\\mathrm{H2^+}",
            },
          },
          {
            detailed: {
              type: "simple",
              particle: "N2",
              charge: 0,
            },
            serialized: {
              particle: "N2",
              summary: "N2",
              latex: "\\mathrm{N2}",
              charge: 0,
            },
          },
          {
            detailed: {
              type: "simple",
              particle: "N2",
              charge: 1,
            },
            serialized: {
              particle: "N2",
              summary: "N2^+",
              latex: "\\mathrm{N2^+}",
              charge: 1,
            },
          },
        ],
      ],
    ];
    it.each(testCases)("%s", async (_description, selection, expected) => {
      const result = await listStates(selection);
      expect(Object.values(result)).toEqual(expected);
    });

    describe("listStateChoices()", () => {
      it("should return 4 choices", async () => {
        const result = await listStateChoices();
        const expected = {
          particle: {
            H2: {
              charge: {
                0: { electronic: {} },
                1: { electronic: {} },
              },
            },
            N2: {
              charge: {
                0: {
                  electronic: {},
                },
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(result).toEqual(expected);
      });
    });

    describe("getIdByLabel()", () => {
      it("given N2 should return a id", async () => {
        const result = await getIdByLabel("N2");
        expect(result).toMatch(/State\/\d+/);
      });
    });
  });
});
