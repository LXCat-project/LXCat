import {
  defaultSearchOptions,
  SearchOptions,
} from "@lxcat/database/dist/cs/queries/public";
import { ParsedUrlQuery } from "querystring";
import { query2array } from "../shared/query2array";

export function query2options(query: ParsedUrlQuery): SearchOptions {
  const defaultReactions = defaultSearchOptions().reactions;
  const reactions =
    query.reactions && !Array.isArray(query.reactions)
      ? JSON.parse(query.reactions)
      : defaultReactions;
  return {
    reactions,
  };
}
