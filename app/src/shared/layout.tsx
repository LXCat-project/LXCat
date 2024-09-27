// SPDX-FileCopyrightText: LXCat team

// SPDX-License-Identifier: AGPL-3.0-or-later

import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";
import { DemoAlert } from "./demo-alert";
import { NavBar } from "./header/nav-bar";

interface Props {
  children: ReactNode;
  title?: string;
}

export const Layout = ({ children, title = "" }: Props) => {
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="An open-access website for collecting, displaying, and downloading electron and ion scattering cross sections, swarm parameters (mobility, diffusion coefficient, etc.), reaction rates, energy distribution functions, etc. and other data required for modeling low temperature plasmas."
        />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <NavBar />
      <DemoAlert />
      <main style={{ padding: 10 }}>{children}</main>
      <footer>
        <div style={{ padding: 10 }}>
          Copyright © 2009-2023,{" "}
          <Link href="/team">the LXCat team</Link>. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};
