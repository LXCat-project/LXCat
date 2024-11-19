// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { jsonLdScriptProps } from "react-schemaorg";
import { Organization, WebSite, WithContext } from "schema-dts";

import { NewsCardProps } from "@/news/card";
import { NewsCarousel } from "@/news/carousel";
import { db } from "@lxcat/database";
import { Center, Fieldset, Text } from "@mantine/core";
import { readFile } from "fs/promises";
import Script from "next/script";
import path from "path";
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

const readNews = async (): Promise<Array<NewsCardProps>> => {
  try {
    const data = await readFile(path.join(process.cwd(), "news.json"), {
      encoding: "utf8",
    });
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const Home = async () => {
  const contributors = await db().listContributors();
  const newsItems = await readNews();

  return (
    <>
      <Script key="jsonld-logo" {...jsonLdScriptProps(jsonLDLogo)} />
      <Script key="jsonld-website" {...jsonLdScriptProps(jsonLDWebsite)} />

      <Center>
        <div
          hidden={newsItems.length === 0}
          style={{ width: "90%", marginTop: 20 }}
        >
          <NewsCarousel newsItems={newsItems} />
        </div>
      </Center>

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
