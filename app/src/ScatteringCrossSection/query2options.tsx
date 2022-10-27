import { SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { ParsedUrlQuery } from "querystring";
import { query2array } from "../shared/query2array";
import {
  stateSelectionFromSearchParam,
  stateSelectionToSearchParam,
} from "../shared/StateFilter";

export function query2options(query: ParsedUrlQuery): SearchOptions {
  const species1 =
    query.species1 && !Array.isArray(query.species1)
      ? query.species1
      : stateSelectionToSearchParam({ particle: {} });
  const species2 =
    query.species2 && !Array.isArray(query.species2)
      ? query.species2
      : stateSelectionToSearchParam({ particle: {} });
  const reactions = query.reactions && !Array.isArray(query.reactions) ? JSON.parse(query.reactions) : []
  return {
    set_name: query2array(query.set_name),
    species1: stateSelectionFromSearchParam(species1),
    species2: stateSelectionFromSearchParam(species2),
    tag: query2array(query.tag),
    reactions
  };
}
