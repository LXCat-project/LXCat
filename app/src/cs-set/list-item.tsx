// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionSetHeading } from "@lxcat/database/set";
import Link from "next/link";

const style = {
  boxShadow: "3px 5px 2px gray",
  padding: 4,
  border: "1px black solid",
};

export const ListItem = (props: CrossSectionSetHeading) => {
  return (
    <Link href={`/scat-css/${props.id}`} style={style} role="listitem">
      {props.name}
    </Link>
  );
};
