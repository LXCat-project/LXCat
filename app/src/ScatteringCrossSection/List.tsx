// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ListItem } from "./ListItem";
import { CrossSectionHeading } from "@lxcat/database/dist/cs/public";

interface Props {
  items: CrossSectionHeading[];
}

export function List({ items }: Props) {
  return (
    <div style={{ display: "flex", gap: "1em", flexWrap: "wrap" }} role="list">
      {items.map((d) => (
        <ListItem key={d.id} {...d} />
      ))}
    </div>
  );
}
