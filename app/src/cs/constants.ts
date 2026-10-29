// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/** The most cross sections that the API returns for a list of ids. */
export const BAG_SIZE = 100;

/**
 * The most cross sections that the plot and compute pages open. Their links,
 * including their permalinks, hold all ids, which take about 8 characters
 * each, so this stays below the 16 kB limit of the request headers.
 */
export const PLOT_SIZE = 1500;

export const PAGE_SIZE = 100;
