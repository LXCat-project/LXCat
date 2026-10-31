// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DenormalizedProcess } from "../denormalized-process";

/** The values that the process table is filtered on, per column. */
export type ProcessFilters = {
  /** Type tags of the reaction. */
  tags: Array<string>;
  /** Names of the databases (contributors) of the sets. */
  organizations: Array<string>;
  /** Keys of the sets. */
  sets: Array<string>;
};

export const noFilters: ProcessFilters = {
  tags: [],
  organizations: [],
  sets: [],
};

export type FilterOptions = {
  tags: Array<string>;
  organizations: Array<string>;
  /** The sets, grouped by the database they are from. */
  sets: Array<
    { group: string; items: Array<{ value: string; label: string }> }
  >;
};

type SetFilter = "organizations" | "sets";
type ProcessSet = DenormalizedProcess["info"]["isPartOf"][number];

// A process or a set matches a filter when any of its values is selected.
const matchesTags = (
  { reaction }: DenormalizedProcess,
  { tags }: ProcessFilters,
) => tags.length === 0 || reaction.typeTags.some((tag) => tags.includes(tag));

/** Whether a set matches the filters, except the one that is skipped. */
const setMatches = (
  { _key, contributor }: ProcessSet,
  { organizations, sets }: ProcessFilters,
  skip?: SetFilter,
) =>
  (skip === "organizations" || organizations.length === 0
    || organizations.includes(contributor.name))
  && (skip === "sets" || sets.length === 0 || sets.includes(_key));

/**
 * Whether a process is in a set that matches the filters. The database and the
 * set have to match for the same set, as a process can be in several sets.
 */
const matchesSets = (
  { info }: DenormalizedProcess,
  filters: ProcessFilters,
) => info.isPartOf.some((set) => setMatches(set, filters));

export const filterProcesses = (
  processes: Array<DenormalizedProcess>,
  filters: ProcessFilters,
) =>
  processes.filter((process) =>
    matchesTags(process, filters) && matchesSets(process, filters)
  );

/**
 * The values to choose from in each filter. These are the values of the
 * processes that match the filters of the other columns, so that a choice
 * always leaves something to show, plus the values that are chosen already.
 */
export const filterOptions = (
  processes: Array<DenormalizedProcess>,
  filters: ProcessFilters,
): FilterOptions => {
  const tags = new Set(filters.tags);
  processes
    .filter((process) => matchesSets(process, filters))
    .forEach(({ reaction }) =>
      reaction.typeTags.forEach((tag) => tags.add(tag))
    );

  // The sets of the processes that match the type filter, which are offered
  // when they match the filter of the other column.
  const typed = processes.filter((process) => matchesTags(process, filters));
  const setsMatching = (skip: SetFilter) =>
    typed.flatMap(({ info }) =>
      info.isPartOf.filter((set) => setMatches(set, filters, skip))
    );

  const organizations = new Set(filters.organizations);
  setsMatching("organizations").forEach(({ contributor }) =>
    organizations.add(contributor.name)
  );

  // The sets that are chosen already can belong to processes that the other
  // filters hide, so their names are looked up in all processes.
  const sets = new Map<string, { name: string; organization: string }>();
  const addSet = ({ _key, name, contributor }: ProcessSet) =>
    sets.set(_key, { name, organization: contributor.name });
  setsMatching("sets").forEach(addSet);
  if (filters.sets.length > 0) {
    processes
      .flatMap(({ info }) => info.isPartOf)
      .filter(({ _key }) => filters.sets.includes(_key))
      .forEach(addSet);
  }

  const groups = new Map<string, Array<{ value: string; label: string }>>();
  sets.forEach(({ name, organization }, key) => {
    groups.set(organization, [
      ...groups.get(organization) ?? [],
      { value: key, label: name },
    ]);
  });

  return {
    tags: [...tags],
    organizations: [...organizations],
    sets: [...groups].map(([group, items]) => ({ group, items })),
  };
};
