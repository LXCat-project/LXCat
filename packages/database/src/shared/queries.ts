// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type Reference } from "@lxcat/schema";
import { Reaction } from "@lxcat/schema/process";
import {
  AnySpecies,
  AnySpeciesSerializable,
  Composition,
  uniqueElementsInComposition,
  Unspecified,
} from "@lxcat/schema/species";
import { AnyAtom, isAtom } from "@lxcat/schema/species/atoms";
import { AnyMolecule, isMolecule } from "@lxcat/schema/species/molecules";
import { LXCatDatabase } from "../lxcat-database.js";

export async function insertDocument(
  this: LXCatDatabase,
  collection: string,
  object: unknown,
): Promise<string> {
  const result = await this.db.query(
    "INSERT @object INTO @@collection LET r = NEW return r._id",
    { object, "@collection": collection },
  );

  return result.next();
}

export async function upsertDocument(
  this: LXCatDatabase,
  collection: string,
  object: unknown,
): Promise<{ id: string; new: boolean }> {
  if (typeof object === "string") object = { string: object };
  const result = await this.db.query(
    "UPSERT @object INSERT @object UPDATE {} IN @@collection LET ret = NEW RETURN { id: ret._id, new: OLD ? false : true }",
    { object, "@collection": collection },
  );

  return result.next();
}

export async function insertEdge(
  this: LXCatDatabase,
  collection: string,
  from: string,
  to: string,
  properties: Record<string, unknown> = {},
): Promise<string> {
  const edge_object = { _from: from, _to: to };

  const result = await this.db.query(
    "UPSERT @from_to INSERT @edge UPDATE {} IN @@collection LET ret = NEW RETURN ret._id",
    {
      "@collection": collection,
      from_to: edge_object,
      edge: { ...edge_object, ...properties },
    },
  );

  return result.next();
}

export async function insertStateDict(
  this: LXCatDatabase,
  states: Record<string, AnySpecies>,
): Promise<Record<string, string>> {
  const id_dict: Record<string, string> = {};

  for (const [id, state] of Object.entries(states)) {
    id_dict[id] = await this.insertStateTree(state);
  }

  return id_dict;
}

export async function insertComposition(
  this: LXCatDatabase,
  composition: Composition | string,
): Promise<{ id: string; new: boolean }> {
  const entry = await this.upsertDocument("Composition", {
    definition: composition,
  });

  if (entry.new && typeof composition !== "string") {
    const elements = uniqueElementsInComposition(composition);

    for (const element of elements) {
      await this.insertEdge("ContainsElement", entry.id, `Element/${element}`);
    }
  }

  return entry;
}

export async function insertState(
  this: LXCatDatabase,
  state: AnySpecies,
): Promise<{ id: string; new: boolean }> {
  const composition = await this.insertComposition(state.composition);

  const dbState = {
    detailed: { ...state, composition: composition.id },
    serialized: AnySpeciesSerializable.parse(state).serialize(),
  };

  return await this.upsertDocument("State", dbState);
}

export async function insertUnspecified(
  this: LXCatDatabase,
  unspecified: Unspecified,
): Promise<string> {
  const { electronic: _, ...topLevelState } = unspecified;
  let { id: retId } = await this.insertState(topLevelState);

  if (unspecified.electronic) {
    const ret = await this.insertState(unspecified);
    if (ret.new) {
      await this.insertEdge("HasDirectSubstate", retId, ret.id);
    }
    retId = ret.id;
  }

  return retId;
}

export async function insertAtom(
  this: LXCatDatabase,
  atom: AnyAtom,
): Promise<string> {
  let ret_id = "";

  if ("electronic" in atom) {
    const topLevelState: AnyAtom = {
      type: "Atom",
      composition: atom.composition,
      charge: atom.charge,
    };

    const t_ret = await this.insertState(topLevelState);
    ret_id = t_ret.id;

    if (Array.isArray(atom.electronic)) {
      for (const electronic of atom.electronic) {
        const elec_state = { ...atom, electronic };
        // FIXME: This parse should not be necessary.
        const e_ret = await this.insertState(AnySpecies.parse(elec_state));
        if (e_ret.new) {
          await this.insertEdge("HasDirectSubstate", t_ret.id, e_ret.id);
        }
      }

      // TODO: Link compound state to its substates.
      ret_id = (await this.insertState(atom)).id;
    } else {
      const e_ret = await this.insertState(atom);
      if (e_ret.new) {
        await this.insertEdge("HasDirectSubstate", t_ret.id, e_ret.id);
      }
      ret_id = e_ret.id;
    }
  } else {
    const t_ret = await this.insertState(atom);
    ret_id = t_ret.id;
  }

  return ret_id;
}

export async function insertMolecule(
  this: LXCatDatabase,
  state: AnyMolecule,
): Promise<string> {
  const { electronic: _, ...topLevelState } = state;
  const topRet = await this.insertState(topLevelState);

  let retId = topRet.id;

  if (state.electronic) {
    if (typeof state.electronic === "string") {
      const e_ret = await this.insertState(state);
      if (e_ret.new) {
        await this.insertEdge("HasDirectSubstate", topRet.id, e_ret.id);
      }
      retId = e_ret.id;
    } else if (Array.isArray(state.electronic)) {
      const compound = await this.insertState(state);

      for (const electronic of state.electronic) {
        const elec_state = { ...state, electronic };
        const e_ret = await this.insertState(AnySpecies.parse(elec_state));

        if (e_ret.new) {
          await this.insertEdge("HasDirectSubstate", topRet.id, e_ret.id);
        }
        if (e_ret.new || compound.new) {
          await this.insertEdge("InCompound", e_ret.id, compound.id);
        }
      }

      retId = compound.id;
    } else {
      // Copy electronic descriptor without vibrational description.
      const { vibrational, ...electronic } = state.electronic;
      const ele_state = {
        ...state,
        electronic,
      };
      const e_ret = await this.insertState(AnySpecies.parse(ele_state));
      if (e_ret.new) {
        await this.insertEdge("HasDirectSubstate", topRet.id, e_ret.id);
      }
      retId = e_ret.id;

      if (state.electronic.vibrational) {
        if (typeof (state.electronic.vibrational) === "string") {
          const v_ret = await this.insertState(state);
          if (v_ret.new) {
            await this.insertEdge("HasDirectSubstate", e_ret.id, v_ret.id);
          }
          retId = v_ret.id;
        } else if (Array.isArray(state.electronic.vibrational)) {
          const compound = await this.insertState(state);
          const { vibrational, ...electronic } = state.electronic;

          for (const vib of vibrational) {
            const vib_state = {
              ...state,
              electronic: { ...electronic, vibrational: vib },
            };
            const v_ret = await this.insertState(AnySpecies.parse(vib_state));
            if (v_ret.new) {
              await this.insertEdge("HasDirectSubstate", e_ret.id, v_ret.id);
            }
            if (v_ret.new || compound.new) {
              await this.insertEdge("InCompound", v_ret.id, compound.id);
            }
          }

          retId = compound.id;
        } else {
          const { rotational, ...vibrational } = state.electronic.vibrational;
          const vib_state = {
            ...state,
            electronic: { ...state.electronic, vibrational },
          };
          const v_ret = await this.insertState(AnySpecies.parse(vib_state));
          if (v_ret.new) {
            await this.insertEdge("HasDirectSubstate", e_ret.id, v_ret.id);
          }
          retId = v_ret.id;

          if (state.electronic.vibrational.rotational) {
            if (Array.isArray(state.electronic.vibrational.rotational)) {
              const compound = await this.insertState(state);

              for (const rot of state.electronic.vibrational.rotational) {
                const rot_state = {
                  ...state,
                  electronic: {
                    ...state.electronic,
                    vibrational: {
                      ...state.electronic.vibrational,
                      rotational: rot,
                    },
                  },
                };

                const r_ret = await this.insertState(
                  AnySpecies.parse(rot_state),
                );
                if (r_ret.new) {
                  await this.insertEdge(
                    "HasDirectSubstate",
                    v_ret.id,
                    r_ret.id,
                  );
                }
                if (r_ret.new || compound.new) {
                  await this.insertEdge("InCompound", r_ret.id, compound.id);
                }
              }

              retId = compound.id;
            } else {
              const r_ret = await this.insertState(state);
              if (r_ret.new) {
                await this.insertEdge(
                  "HasDirectSubstate",
                  v_ret.id,
                  r_ret.id,
                );
              }
              retId = r_ret.id;
            }
          }
        }
      }
    }
  }

  return retId;
}

/**
 * Strategy: add states in a top down fashion.
 */
export async function insertStateTree(
  this: LXCatDatabase,
  state: AnySpecies,
): Promise<string> {
  if (state.type === "Unspecified") {
    return this.insertUnspecified(state);
  } else if (isAtom(state)) {
    return this.insertAtom(state);
  } else if (isMolecule(state)) {
    return this.insertMolecule(state);
  }

  const ret = await this.insertState(state);
  return ret.id;
}

export async function insertReferenceDict(
  this: LXCatDatabase,
  references: Record<string, Reference>,
): Promise<Record<string, string>> {
  const id_dict: Record<string, string> = {};

  for (const [id, reference] of Object.entries(references)) {
    // TODO: Either ensure DOI is always there or add more machinery to compare
    //       references.
    const key = reference.DOI && await this.getReferenceKeyByDOI(reference.DOI);

    if (key) {
      id_dict[id] = `Reference/${key}`;
    } else {
      id_dict[id] = (await this.upsertDocument("Reference", reference)).id;
    }
  }

  return id_dict;
}

export async function insertReactionWithDict(
  this: LXCatDatabase,
  dict: Record<string, string>,
  reaction: Reaction<string>,
): Promise<string> {
  // Insert all states.
  // Insert the reaction and connect all states using 'Consumes'
  // and 'Produces' edges. Annotate them with the count.
  const mappedReaction = mapReaction(dict, reaction);
  const reactionIdFromDb = await this.findReactionId(mappedReaction);

  if (reactionIdFromDb !== undefined) {
    return reactionIdFromDb;
  }

  const r_id = await this.insertDocument("Reaction", {
    reversible: reaction.reversible,
    typeTags: reaction.typeTags,
  });

  for (const entry of mappedReaction.lhs) {
    await this.insertEdge("Consumes", r_id, entry.state, {
      count: entry.count,
    });
  }
  for (const entry of mappedReaction.rhs) {
    await this.insertEdge("Produces", r_id, entry.state, {
      count: entry.count,
    });
  }

  return r_id;
}

export function mapReaction(
  dict: Record<string, string>,
  reaction: Reaction<string>,
) {
  const lhs = reaction.lhs.map((s) => ({ ...s, state: dict[s.state] }));
  const rhs = reaction.rhs.map((s) => ({ ...s, state: dict[s.state] }));
  return { ...reaction, lhs, rhs };
}
