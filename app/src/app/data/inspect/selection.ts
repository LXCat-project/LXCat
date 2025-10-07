// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DenormalizedProcess } from "../denormalized-process";

/**
 * The selection after the header checkbox is clicked, where `shown` are the
 * processes that match the filters, on any page. If any of them is selected,
 * they are all deselected, and otherwise they are all selected.
 *
 * Processes that the filters hide stay as they are. The result follows the
 * order of `processes`.
 */
export const toggleAll = (
  processes: Array<DenormalizedProcess>,
  shown: Array<DenormalizedProcess>,
  selected: Array<DenormalizedProcess>,
): Array<DenormalizedProcess> => {
  const selectedKeys = new Set(selected.map(({ info: { _key } }) => _key));
  const shownKeys = new Set(shown.map(({ info: { _key } }) => _key));

  // Selecting everything is only offered when nothing is selected, as it can
  // make the page slow for a large selection.
  const someShownSelected = shown.some(({ info: { _key } }) =>
    selectedKeys.has(_key)
  );

  return processes.filter(({ info: { _key } }) =>
    someShownSelected
      ? selectedKeys.has(_key) && !shownKeys.has(_key)
      : selectedKeys.has(_key) || shownKeys.has(_key)
  );
};
