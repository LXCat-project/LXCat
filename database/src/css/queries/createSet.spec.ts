import { beforeAll, describe, expect, it } from "vitest";

import { CSL } from "@lxcat/schema/dist/core/csl";
import { Storage } from "@lxcat/schema/dist/core/enumeration";

import { db } from "../../db";
import { insert_input_set } from "./author_write";
import { startDbWithUserAndCssCollections } from "./testutils";
import {
  insert_reference_dict,
  insert_state_dict,
  upsert_document,
} from "../../shared/queries";
import { Dict } from "@lxcat/schema/dist/core/util";
import { insert_cs_with_dict } from "../../cs/queries/write";
import { byOwnerAndId } from "./author_read";

const email = "somename@example.com";

beforeAll(startDbWithUserAndCssCollections);

describe("giving draft set made with existing draft cross section", () => {
  let keycs1: string;
  let keycss1: string;

  beforeAll(async () => {
    const states = {
      s1: {
        particle: "A",
        charge: 0,
      },
      s2: {
        particle: "B",
        charge: 1,
      },
    };
    const references: Dict<CSL.Data> = {
      r1: {
        id: "1",
        type: "article",
        title: "Some article title",
      },
    };
    const organization = await upsert_document("Organization", {
      name: "Some organization",
    });
    const stateLookup = await insert_state_dict(states);
    const refLookup = await insert_reference_dict(references);
    const idcs1 = await insert_cs_with_dict(
      {
        reaction: {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [{ count: 1, state: "s2" }],
          reversible: false,
          type_tags: [],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: ["r1"],
      },
      stateLookup,
      refLookup,
      organization.id,
      "draft"
    );
    keycs1 = idcs1.replace("CrossSection/", "");

    keycss1 = await insert_input_set(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references,
        states,
        processes: [
          {
            id: keycs1,
            reaction: {
              lhs: [{ count: 1, state: "s1" }],
              rhs: [{ count: 1, state: "s2" }],
              reversible: false,
              type_tags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: ["r1"],
          },
        ],
      },
      "draft"
    );
  }, 999999);

  it("should have a single cross section", async () => {
    const data = await db().collection("CrossSection").count();
    expect(data.count).toEqual(1);
  });

  it("should have a single cross section set", async () => {
    const data = await db().collection("CrossSectionSet").count();
    expect(data.count).toEqual(1);
  });

  it("should have set with existing cross section", async () => {
    const set = await byOwnerAndId(email, keycss1);
    const expected = {
      complete: false,
      description: "Some description",
      name: "Some name",
      states: expect.any(Object), // TODO assert it
      references: expect.any(Object), // TODO assert it
      processes: [
        {
          id: keycs1,
          reaction: {
            lhs: [{ count: 1, state: expect.stringMatching(/\d+/) }],
            rhs: [{ count: 1, state: expect.stringMatching(/\d+/) }],
            reversible: false,
            type_tags: [],
          },
          threshold: 42,
          type: Storage.LUT,
          labels: ["Energy", "Cross Section"],
          units: ["eV", "m^2"],
          data: [[1, 3.14e-20]],
          reference: [expect.stringMatching(/\d+/)],
        },
      ],
      contributor: "Some organization",
    };
    expect(set).toEqual(expected);
  });
});
