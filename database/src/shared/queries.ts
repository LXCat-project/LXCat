import { parse_state } from "@lxcat/schema/dist/core/parse";
import { CSL } from "@lxcat/schema/dist/core/csl";
import {
  AtomicGenerator,
  MolecularGenerator,
} from "@lxcat/schema/dist/core/generators";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { DBState, InState } from "@lxcat/schema/dist/core/state";
import { Dict } from "@lxcat/schema/dist/core/util";
import { db } from "../db";
import { findReactionId } from "./queries/reaction";

export async function insert_document(
  collection: string,
  object: unknown
): Promise<string> {
  const result = await db().query(
    "INSERT @object INTO @@collection LET r = NEW return r._id",
    { object, "@collection": collection }
  );

  return result.next();
  /* return result.toArray()[0]; */
}

export async function upsert_document(
  collection: string,
  object: unknown
): Promise<{ id: string; new: boolean }> {
  if (typeof object === "string") object = { string: object };
  const result = await db().query(
    "UPSERT @object INSERT @object UPDATE {} IN @@collection LET ret = NEW RETURN { id: ret._id, new: OLD ? false : true }",
    { object, "@collection": collection }
  );

  return result.next();
}

export async function insert_edge(
  collection: string,
  from: string,
  to: string,
  properties: Record<string, unknown> = {}
): Promise<string> {
  const edge_object = { _from: from, _to: to };

  const result = await db().query(
    "UPSERT @from_to INSERT @edge UPDATE {} IN @@collection LET ret = NEW RETURN ret._id",
    {
      "@collection": collection,
      from_to: edge_object,
      edge: { ...edge_object, ...properties },
    }
  );

  return result.next();
}

export async function insert_state_dict(
  states: Dict<InState<any>>
): Promise<Dict<string>> {
  const id_dict: Dict<string> = {};

  for (const [id, state] of Object.entries(states)) {
    id_dict[id] = await insert_state_tree(state);
  }

  return id_dict;
}

async function insert_state<T>(
  state: DBState<T>
): Promise<{ id: string; new: boolean }> {
  return upsert_document("State", state);
}

async function insert_state_tree<T extends AtomicGenerator<E, any>, E>(
  state: InState<T>
): Promise<string>;
async function insert_state_tree<
  T extends MolecularGenerator<E, V, R, any>,
  E,
  V,
  R
>(state: InState<T>): Promise<string> {
  // FIXME: This function assumes that compound states on multiple levels
  // are not supported.
  /* Strategy Add states in a top down fashion.  Compound levels should
   * be treated differently from singular levels.
   */
  const in_compound: Array<string> = [];
  let ret_id = "";

  let tmp_state = { ...state };
  delete tmp_state.type;
  delete tmp_state.electronic;

  // FIXME: Link top level states to particle.
  const t_ret = await insert_state(parse_state(tmp_state));
  ret_id = t_ret.id;

  if (state.electronic) {
    tmp_state = { ...state };

    for (const elec of state.electronic) {
      tmp_state.electronic = [{ ...elec }];
      delete tmp_state.electronic[0].vibrational;

      /* console.log(state_to_string(tmp_state)); */
      const e_ret = await insert_state(parse_state(tmp_state));
      if (e_ret.new) await insert_edge("HasDirectSubstate", t_ret.id, e_ret.id);

      if (elec.vibrational) {
        for (const vib of elec.vibrational) {
          tmp_state.electronic[0].vibrational = [{ ...vib }];
          delete tmp_state.electronic[0].vibrational[0].rotational;

          /* console.log(state_to_string(tmp_state)); */
          const v_ret = await insert_state(parse_state(tmp_state));
          if (v_ret.new)
            await insert_edge("HasDirectSubstate", e_ret.id, v_ret.id);

          if (vib.rotational) {
            for (const rot of vib.rotational) {
              tmp_state.electronic[0].vibrational[0].rotational = [{ ...rot }];
              /* console.log(state_to_string(tmp_state)); */
              const r_ret = await insert_state(parse_state(tmp_state));
              if (r_ret.new)
                await insert_edge("HasDirectSubstate", v_ret.id, r_ret.id);

              in_compound.push(r_ret.id);
              ret_id = r_ret.id;
            }
          } else {
            in_compound.push(v_ret.id);
            ret_id = v_ret.id;
          }
        }
      } else {
        in_compound.push(e_ret.id);
        ret_id = e_ret.id;
      }
    }

    if (in_compound.length > 1) {
      const c_ret = await insert_state(parse_state(state));
      if (c_ret.new) {
        for (const sub_id of in_compound) {
          await insert_edge("InCompound", sub_id, c_ret.id);
        }
      }
      return c_ret.id;
    }
  }

  return ret_id;
}
// TODO: Check what happens when adding a string instead of a 'Reference' object.

export async function insert_reference_dict(
  references: Dict<CSL.Data | string>
): Promise<Dict<string>> {
  const id_dict: Dict<string> = {};

  for (const [id, reference] of Object.entries(references)) {
    id_dict[id] = (await upsert_document("Reference", reference)).id;
  }

  return id_dict;
}

export async function insert_reaction_with_dict(
  dict: Dict<string>,
  reaction: Reaction<string>
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
function mapReaction(dict: Dict<string>, reaction: Reaction<string>) {
  const lhs = reaction.lhs.map((s) => ({ ...s, state: dict[s.state] }));
  const rhs = reaction.rhs.map((s) => ({ ...s, state: dict[s.state] }));
  return { ...reaction, lhs, rhs };
}
