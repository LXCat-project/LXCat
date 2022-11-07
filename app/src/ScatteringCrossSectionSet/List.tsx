// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ListItem } from "./ListItem";
import { CrossSectionSetHeading } from "@lxcat/database/dist/css/public";

interface Props {
  items: CrossSectionSetHeading[];
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
