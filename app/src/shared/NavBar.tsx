// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Image from "next/image";
import Link from "next/link";
import { CSSProperties } from "react";
import logo from "../../public/lxcat.png";
import { UserAnchor } from "../auth/UserAnchor";

const navStyle: CSSProperties = {
  backgroundColor: "#254779",
  display: "flex",
  color: "#d1d4da",
  alignItems: "center",
  paddingLeft: 24,
  paddingRight: 24,
  minHeight: 60,
  gap: 10,
};

export const NavBar = () => {
  return (
    <nav style={navStyle}>
      <Link href="/">
        <Image src={logo} alt="Logo of LXCat" />
      </Link>
      <div
        style={{ flexGrow: 1, display: "flex", flexDirection: "row", gap: 10 }}
      >
        <Link href="/data-center">Data center</Link>
        <Link href="/team">Team</Link>
        <Link href="/docs/index">Docs</Link>
      </div>
      <UserAnchor />
    </nav>
  );
};
