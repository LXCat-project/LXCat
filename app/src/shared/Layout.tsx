import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";
import { NavBar } from "./NavBar";

interface Props {
  children: ReactNode;
  title?: string;
}

export const Layout = ({ children, title = "" }: Props) => {
  return (
    <div>
      <Head>
        <title>LXCat next generation{title && `: ${title}`}</title>
        <meta
          name="description"
          content="An open-access website for collecting, displaying, and downloading electron and ion scattering cross sections, swarm parameters (mobility, diffusion coefficient, etc.), reaction rates, energy distribution functions, etc. and other data required for modeling low temperature plasmas."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NavBar />
      <main style={{ padding: 10 }}>{children}</main>
      <footer>
        <div style={{ padding: 10 }}>
          Copyright © 2009-2022, <Link href="/team">the LXCat team</Link>. All
          Rights Reserved.
        </div>
      </footer>
    </div>
  );
};
