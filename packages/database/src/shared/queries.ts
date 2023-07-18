// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CSL } from "@lxcat/schema/dist/core/csl";
import { parseState, stateIsAtom } from "@lxcat/schema/dist/core/parse";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { AnySpecies, KeyedSpecies } from "@lxcat/schema/dist/core/species";
import { DBState, State } from "@lxcat/schema/dist/core/state";
import { Dict } from "@lxcat/schema/dist/core/util";
import { produce } from "immer";
import { db } from "../db";
import { findReactionId } from "./queries/reaction";

export async function insert_document(
  collection: string,
  object: unknown,
): Promise<string> {
  const result = await db().query(
    "INSERT @object INTO @@collection LET r = NEW return r._id",
    { object, "@collection": collection },
  );

  return result.next();
  /* return result.toArray()[0]; */
}

export async function upsert_document(
  collection: string,
  object: unknown,
): Promise<{ id: string; new: boolean }> {
  if (typeof object === "string") object = { string: object };
  const result = await db().query(
    "UPSERT @object INSERT @object UPDATE {} IN @@collection LET ret = NEW RETURN { id: ret._id, new: OLD ? false : true }",
    { object, "@collection": collection },
  );

  return result.next();
}

export async function insert_edge(
  collection: string,
  from: string,
  to: string,
  properties: Record<string, unknown> = {},
): Promise<string> {
  const edge_object = { _from: from, _to: to };

  const result = await db().query(
    "UPSERT @from_to INSERT @edge UPDATE {} IN @@collection LET ret = NEW RETURN ret._id",
    {
      "@collection": collection,
      from_to: edge_object,
      edge: { ...edge_object, ...properties },
    },
  );

  return result.next();
}

export async function insert_state_dict(
  states: Dict<State<AnySpecies>>,
): Promise<Dict<string>> {
  const id_dict: Dict<string> = {};

  for (const [id, state] of Object.entries(states)) {
    id_dict[id] = await insert_state_tree(state);
  }

  return id_dict;
}

async function insert_state<T extends AnySpecies>(
  state: DBState<KeyedSpecies<T>>,
): Promise<{ id: string; new: boolean }> {
  return upsert_document("State", state);
}

/**
 * Strategy: add states in a top down fashion.
 */
async function insert_state_tree<T extends AnySpecies>(
  state: State<T>,
): Promise<string> {
  let ret_id = "";

  let topLevelState: State<AnySpecies> = {
    type: "simple",
    particle: state.particle,
    charge: state.charge,
  };

  // FIXME: Link top level states to particle.
  const t_ret = await insert_state(parseState(topLevelState));
  ret_id = t_ret.id;

  if (stateIsAtom(state)) {
    if (Array.isArray(state.electronic)) {
      for (const electronic of state.electronic) {
        const elec_state = { ...state, electronic };
        const e_ret = await insert_state(parseState(elec_state));
        if (e_ret.new) {
          await insert_edge("HasDirectSubstate", t_ret.id, e_ret.id);
        }
      }

      // TODO: Link compound state to its substates.
      ret_id = (await insert_state(parseState(state))).id;
    } else {
      const e_ret = await insert_state(parseState(state));
      if (e_ret.new) await insert_edge("HasDirectSubstate", t_ret.id, e_ret.id);
      ret_id = e_ret.id;
    }
  } else if (state.type !== "simple") {
    if (Array.isArray(state.electronic)) {
      for (const electronic of state.electronic) {
        const elec_state = { ...state, electronic };
        const e_ret = await insert_state(parseState(elec_state));
        if (e_ret.new) {
          await insert_edge("HasDirectSubstate", t_ret.id, e_ret.id);
        }
      }

      // TODO: Link compound state to its substates.
      ret_id = (await insert_state(parseState(state))).id;
    } else {
      const ele_state = {
        ...state,
        electronic: produce(state.electronic, (ele) => {
          delete ele.vibrational;
          return ele;
        }),
      };
      const e_ret = await insert_state(parseState(ele_state));
      if (e_ret.new) await insert_edge("HasDirectSubstate", t_ret.id, e_ret.id);
      ret_id = e_ret.id;

      if (state.electronic.vibrational) {
        if (typeof (state.electronic.vibrational) === "string") {
          const v_ret = await insert_state(parseState(state));
          if (v_ret.new) {
            await insert_edge("HasDirectSubstate", e_ret.id, v_ret.id);
          }
          ret_id = v_ret.id;
        } else if (Array.isArray(state.electronic.vibrational)) {
          for (const vib of state.electronic.vibrational) {
            const vib_state = {
              ...state,
              electronic: produce(state.electronic, (ele) => {
                ele.vibrational = vib;
                return ele;
              }),
            };
            const v_ret = await insert_state(parseState(vib_state));
            if (v_ret.new) {
              await insert_edge("HasDirectSubstate", e_ret.id, v_ret.id);
            }
          }

          // TODO: Link compound state to its substates.
          ret_id = (await insert_state(parseState(state))).id;
        } else {
          // TODO: Add vibrational parent and rotational substates.
          const vib_state = {
            ...state,
            electronic: {
              ...state.electronic,
              vibrational: produce(state.electronic.vibrational, (vib) => {
                delete vib.rotational;
                return vib;
              }),
            },
          };
          const v_ret = await insert_state(parseState(vib_state));
          if (v_ret.new) {
            await insert_edge("HasDirectSubstate", e_ret.id, v_ret.id);
          }
          ret_id = v_ret.id;

          if (state.electronic.vibrational.rotational) {
            if (Array.isArray(state.electronic.vibrational.rotational)) {
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

                const r_ret = await insert_state(parseState(rot_state));
                if (r_ret.new) {
                  await insert_edge("HasDirectSubstate", v_ret.id, r_ret.id);
                }
              }

              // TODO: Link compound state to its substates.
              ret_id = (await insert_state(parseState(state))).id;
            } else {
              const r_ret = await insert_state(parseState(state));
              if (r_ret.new) {
                await insert_edge("HasDirectSubstate", v_ret.id, r_ret.id);
              }
              ret_id = r_ret.id;
            }
          }
        }
      }
    }
  }

  return ret_id;
}
// TODO: Check what happens when adding a string instead of a 'Reference' object.

export async function insert_reference_dict(
  references: Dict<CSL.Data | string>,
): Promise<Dict<string>> {
  const id_dict: Dict<string> = {};

  for (const [id, reference] of Object.entries(references)) {
    id_dict[id] = (await upsert_document("Reference", reference)).id;
  }

  return id_dict;
}

export async function insert_reaction_with_dict(
  dict: Dict<string>,
  reaction: Reaction<string>,
): Promise<string> {
  // Insert all states.
  // Insert the reaction and connect all states using 'Consumes'
  // and 'Produces' edges. Annotate them with the count.
  const mappedReaction = mapReaction(dict, reaction);
  const reactionIdFromDb = await findReactionId(mappedReaction);
  if (reactionIdFromDb !== undefined) {
    return reactionIdFromDb;
  }

  const r_id = await insert_document("Reaction", {
    reversible: reaction.reversible,
    type_tags: reaction.type_tags,
  });

  for (const entry of mappedReaction.lhs) {
    await insert_edge("Consumes", r_id, entry.state, {
      count: entry.count,
    });
  }
  for (const entry of mappedReaction.rhs) {
    await insert_edge("Produces", r_id, entry.state, {
      count: entry.count,
    });
  }

  return r_id;
}
export function mapReaction(dict: Dict<string>, reaction: Reaction<string>) {
  const lhs = reaction.lhs.map((s) => ({ ...s, state: dict[s.state] }));
  const rhs = reaction.rhs.map((s) => ({ ...s, state: dict[s.state] }));
  return { ...reaction, lhs, rhs };
}
