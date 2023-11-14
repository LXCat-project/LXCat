// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionSetHeading } from "@lxcat/database/set";
import { ListItem } from "./ListItem";

interface Props {
  items: CrossSectionSetHeading[];
}

export function List({ items }: Props) {
  return (
    <div style={{ display: "flex", gap: "1em", flexWrap: "wrap" }} role="list">
      {items.map((d) => <ListItem key={d.id} {...d} />)}
    </div>
  );
}
