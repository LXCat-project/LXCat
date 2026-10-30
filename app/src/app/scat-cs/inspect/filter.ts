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

// A process matches when any of its values is selected. The database and the
// set are not those of the first set only, as a process can be in several.
const matchers: {
  [Key in keyof ProcessFilters]: (
    process: DenormalizedProcess,
    values: Array<string>,
  ) => boolean;
} = {
  tags: ({ reaction }, values) =>
    reaction.typeTags.some((tag) => values.includes(tag)),
  organizations: ({ info }, values) =>
    info.isPartOf.some(({ contributor }) => values.includes(contributor.name)),
  sets: ({ info }, values) =>
    info.isPartOf.some(({ _key }) => values.includes(_key)),
};

/** Whether a process matches the filters, except the one that is skipped. */
const matches = (
  process: DenormalizedProcess,
  filters: ProcessFilters,
  skip?: keyof ProcessFilters,
) =>
  (Object.keys(matchers) as Array<keyof ProcessFilters>).every((key) =>
    key === skip
    || filters[key].length === 0
    || matchers[key](process, filters[key])
  );

export const filterProcesses = (
  processes: Array<DenormalizedProcess>,
  filters: ProcessFilters,
) => processes.filter((process) => matches(process, filters));

/**
 * The values to choose from in each filter. These are the values of the
 * processes that match the filters of the other columns, so that a choice
 * always leaves something to show, plus the values that are chosen already.
 */
export const filterOptions = (
  processes: Array<DenormalizedProcess>,
  filters: ProcessFilters,
): FilterOptions => {
  const matching = (skip: keyof ProcessFilters) =>
    processes.filter((process) => matches(process, filters, skip));

  const tags = new Set(filters.tags);
  matching("tags").forEach(({ reaction }) =>
    reaction.typeTags.forEach((tag) => tags.add(tag))
  );

  const organizations = new Set(filters.organizations);
  matching("organizations").forEach(({ info }) =>
    info.isPartOf.forEach(({ contributor }) =>
      organizations.add(contributor.name)
    )
  );

  // The sets that are chosen already can belong to processes that the other
  // filters hide, so their names are looked up in all processes.
  const sets = new Map<string, { name: string; organization: string }>();
  const addSets = (process: DenormalizedProcess, only?: Array<string>) =>
    process.info.isPartOf.forEach(({ _key, name, contributor }) => {
      if (!only || only.includes(_key)) {
        sets.set(_key, { name, organization: contributor.name });
      }
    });
  matching("sets").forEach((process) => addSets(process));
  if (filters.sets.length > 0) {
    processes.forEach((process) => addSets(process, filters.sets));
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
