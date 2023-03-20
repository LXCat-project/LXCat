// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { NextPage } from "next";
import Head from "next/head";
import { jsonLdScriptProps } from "react-schemaorg";
import { Organization, WebSite, WithContext } from "schema-dts";

import { Layout } from "../shared/Layout";

import logo from "../../public/lxcat.png";

const jsonLDLogo: WithContext<Organization> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  url: "/", // TODO make base URL configurable
  logo: logo.src,
};

const jsonLDWebsite: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "/",
  hasPart: {
    "@type": "DataCatalog",
    name: "LXCat",
  },
};

const Home: NextPage = () => {
  return (
    <Layout>
      <Head>
        <script key="jsonld-logo" {...jsonLdScriptProps(jsonLDLogo)} />
        <script key="jsonld-website" {...jsonLdScriptProps(jsonLDWebsite)} />
      </Head>
      <h1>Welcome to LXCat</h1>

      <p>
        This is the next version of the LXCat web site and is under heavy
        construction.
      </p>
    </Layout>
  );
};

export default Home;
