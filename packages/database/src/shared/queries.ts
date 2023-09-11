// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference } from "@lxcat/schema/dist/common/reference";
import { Reaction } from "@lxcat/schema/dist/process/reaction";
import { isAtom, SerializableState, State } from "@lxcat/schema/dist/state";
import { db } from "../db";
import { findReactionId } from "./queries/reaction";

export async function insertDocument(
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

export async function upsertDocument(
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

export async function insertEdge(
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

export async function insertStateDict(
  states: Record<string, SerializableState>,
): Promise<Record<string, string>> {
  const id_dict: Record<string, string> = {};

  for (const [id, state] of Object.entries(states)) {
    id_dict[id] = await insertStateTree(state);
  }

  return id_dict;
}

async function insertState(
  state: State,
): Promise<{ id: string; new: boolean }> {
  const dbState = {
    detailed: state,
    serialized: State.parse(state).serialize(),
  };
  return upsertDocument("State", dbState);
}

/**
 * Strategy: add states in a top down fashion.
 */
async function insertStateTree(
  state: State,
): Promise<string> {
  let ret_id = "";

  let topLevelState: State = {
    type: "simple",
    particle: state.particle,
    charge: state.charge,
  };

  // FIXME: Link top level states to particle.
  const t_ret = await insertState(topLevelState);
  ret_id = t_ret.id;

  if (state.type === "unspecified") {
    const e_ret = await insertState(state);
    if (e_ret.new) await insertEdge("HasDirectSubstate", t_ret.id, e_ret.id);
    ret_id = e_ret.id;
  } else if (isAtom(state)) {
    if (Array.isArray(state.electronic)) {
      for (const electronic of state.electronic) {
        const elec_state = { ...state, electronic };
        const e_ret = await insertState(State.parse(elec_state));
        if (e_ret.new) {
          await insertEdge("HasDirectSubstate", t_ret.id, e_ret.id);
        }
      }

      // TODO: Link compound state to its substates.
      ret_id = (await insertState(state)).id;
    } else {
      const e_ret = await insertState(state);
      if (e_ret.new) await insertEdge("HasDirectSubstate", t_ret.id, e_ret.id);
      ret_id = e_ret.id;
    }
  } else if (state.type !== "simple") {
    if (Array.isArray(state.electronic)) {
      for (const electronic of state.electronic) {
        const elec_state = { ...state, electronic };
        const e_ret = await insertState(State.parse(elec_state));
        if (e_ret.new) {
          await insertEdge("HasDirectSubstate", t_ret.id, e_ret.id);
        }
      }

      // TODO: Link compound state to its substates.
      ret_id = (await insertState(state)).id;
    } else {
      // Copy electronic descriptor without vibrational description.
      const { vibrational, ...electronic } = state.electronic;
      const ele_state = {
        ...state,
        electronic,
      };
      const e_ret = await insertState(State.parse(ele_state));
      if (e_ret.new) await insertEdge("HasDirectSubstate", t_ret.id, e_ret.id);
      ret_id = e_ret.id;

      if (state.electronic.vibrational) {
        if (typeof (state.electronic.vibrational) === "string") {
          const v_ret = await insertState(state);
          if (v_ret.new) {
            await insertEdge("HasDirectSubstate", e_ret.id, v_ret.id);
          }
          ret_id = v_ret.id;
        } else if (Array.isArray(state.electronic.vibrational)) {
          const { vibrational, ...electronic } = state.electronic;
          for (const vib of vibrational) {
            const vib_state = {
              ...state,
              electronic: { ...electronic, vibrational: vib },
            };
            const v_ret = await insertState(State.parse(vib_state));
            if (v_ret.new) {
              await insertEdge("HasDirectSubstate", e_ret.id, v_ret.id);
            }
          }

          // TODO: Link compound state to its substates.
          ret_id = (await insertState(state)).id;
        } else {
          const { rotational, ...vibrational } = state.electronic.vibrational;
          const vib_state = {
            ...state,
            electronic: { ...state.electronic, vibrational },
          };
          const v_ret = await insertState(State.parse(vib_state));
          if (v_ret.new) {
            await insertEdge("HasDirectSubstate", e_ret.id, v_ret.id);
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

                const r_ret = await insertState(State.parse(rot_state));
                if (r_ret.new) {
                  await insertEdge("HasDirectSubstate", v_ret.id, r_ret.id);
                }
              }

              // TODO: Link compound state to its substates.
              ret_id = (await insertState(state)).id;
            } else {
              const r_ret = await insertState(state);
              if (r_ret.new) {
                await insertEdge("HasDirectSubstate", v_ret.id, r_ret.id);
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
export async function insertReferenceDict(
  references: Record<string, Reference>,
): Promise<Record<string, string>> {
  const id_dict: Record<string, string> = {};

  for (const [id, reference] of Object.entries(references)) {
    id_dict[id] = (await upsertDocument("Reference", reference)).id;
  }

  return id_dict;
}

export async function insertReactionWithDict(
  dict: Record<string, string>,
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

  const r_id = await insertDocument("Reaction", {
    reversible: reaction.reversible,
    typeTags: reaction.typeTags,
  });

  for (const entry of mappedReaction.lhs) {
    await insertEdge("Consumes", r_id, entry.state, {
      count: entry.count,
    });
  }
  for (const entry of mappedReaction.rhs) {
    await insertEdge("Produces", r_id, entry.state, {
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
