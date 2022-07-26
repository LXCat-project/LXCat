import { Dict } from "@lxcat/schema/dist/core/util";
import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { insert_cs_with_dict, updateSection } from "./write";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { db } from "../../db";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { deepClone } from "../../css/queries/deepClone";
import { insert_state_dict } from "../../shared/queries";
import { byOwnerAndId } from "./author_read";
import { Status } from "../../shared/types/version_info";

export async function createCrossSection(
  state_ids: Dict<string>,
  status: Status = "published"
) {
  const cs: CrossSection<string, string> = {
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
    reference: [],
  };
  const idcs1 = await insert_cs_with_dict(
    cs,
    state_ids,
    {},
    "Some organization",
    status
  );
  const keycs1 = idcs1.replace("CrossSection/", "");
  return {
    __return: truncateCrossSectionCollections,
    keycs1,
  };
}

export async function truncateCrossSectionCollections() {
  const collections2Truncate = [
    "Consumes",
    "CrossSection",
    "CrossSectionHistory",
    "Reaction",
    "Produces",
    "Reference",
    "References",
  ];
  await Promise.all(
    collections2Truncate.map((c) => db().collection(c).truncate())
  );
}

export async function insertSampleStateIds() {
  const states = {
    s1: {
      particle: "A",
      charge: 0,
    },
    s2: {
      particle: "B",
      charge: 1,
    },
    s3: {
      particle: "C",
      charge: 2,
    },
    s4: {
      particle: "D",
      charge: 3,
    },
  };
  return await insert_state_dict(states);
}

export async function createDraftFromPublished(
  keycs1: string,
  alter: (cs: CrossSection<string, string, LUT>) => void
) {
  const cs = await byOwnerAndId("somename@example.com", keycs1);
  if (cs === undefined) {
    throw Error(`Unable to retrieve cross section with id ${keycs1}`);
  }
  const cs1 = cs;
  const draftcs = deepClone(cs1);
  alter(draftcs);
  const lhs0 = draftcs.reaction.lhs[0].state;
  const rhs0 = draftcs.reaction.rhs[0].state;
  const draftStateIds = {
    [lhs0]: `State/${lhs0}`,
    [rhs0]: `State/${rhs0}`,
  };
  const idcs2 = await updateSection(
    keycs1,
    draftcs,
    "My first update",
    draftStateIds,
    {},
    "Some organization"
  );
  const keycs2 = idcs2.replace("CrossSection/", "");
  return { cs1, keycs2 };
}
