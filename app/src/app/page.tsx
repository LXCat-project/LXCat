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

      <Title order={1} style={{ margin: 10 }}>Welcome to LXCat!</Title>

      <Text style={{ margin: 10 }}>
        This is the next version of the LXCat web site and is under heavy
        construction.
      </Text>

      <Fieldset>
        <Title order={2} style={{ marginLeft: 10, marginBottom: 10 }}>
          List of data contributors
        </Title>
        <ContributorTable contributors={contributors} />
      </Fieldset>
    </>
  );
};

export default Home;
