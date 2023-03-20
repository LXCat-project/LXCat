// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReactionTemplate } from "@lxcat/database/dist/cs/picker/types";
import { useRouter } from "next/router";
import { SWRFilterComponent } from "./SWRFilterComponent";

interface Props {
  selection: Array<ReactionTemplate>;
  onChange: (newSelection: Array<ReactionTemplate>) => void | Promise<void>;
}

export const Filter = ({ selection, onChange }: Props) => {
  const router = useRouter();

  function onFilterChange(
    newSelection: Array<ReactionTemplate>,
    event?: string,
  ) {
    const query = new URLSearchParams({
      reactions: JSON.stringify(newSelection),
    }).toString();

    if (event?.startsWith("reactions")) {
      router.push({ query }, undefined, { shallow: true });
      onChange(newSelection);
    } else {
      router.push({ query });
    }
  }

  return <SWRFilterComponent selection={selection} onChange={onFilterChange} />;
};
