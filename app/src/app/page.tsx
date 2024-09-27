// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { jsonLdScriptProps } from "react-schemaorg";
import { Organization, WebSite, WithContext } from "schema-dts";

import { db } from "@lxcat/database";
import { Fieldset, Text, Title } from "@mantine/core";
import Script from "next/script";
import logo from "../../public/lxcat.png";
import { ContributorTable } from "./contributor-table";

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

const Home = async () => {
  const contributors = await db().listContributors();

  return (
    <>
      <Script key="jsonld-logo" {...jsonLdScriptProps(jsonLDLogo)} />
      <Script key="jsonld-website" {...jsonLdScriptProps(jsonLDWebsite)} />

      <Fieldset
        legend=<Text fw={700}>List of data contributors</Text>
        style={{ marginTop: 15, marginLeft: 10, marginRight: 10 }}
      >
        <ContributorTable contributors={contributors} />
      </Fieldset>
    </>
  );
};

export const dynamic = "force-dynamic";

export default Home;
