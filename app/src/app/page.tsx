// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { jsonLdScriptProps } from "react-schemaorg";
import { Organization, WebSite, WithContext } from "schema-dts";

import { NewsCardProps } from "@/news/card";
import { NewsCarousel } from "@/news/carousel";
import { db } from "@lxcat/database";
import { Container, Fieldset, Text } from "@mantine/core";
import { readFile } from "fs/promises";
import Script from "next/script";
import path from "path";
import { env } from "process";
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
    const data = await readFile(
      /*turbopackIgnore: true*/ env.NEWS_PATH
        ?? path.join(process.cwd(), "news.json"),
      {
        encoding: "utf8",
      },
    );
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

      <Container size="xl" py="md">
        <div hidden={newsItems.length === 0}>
          <NewsCarousel newsItems={newsItems} />
        </div>

        <Fieldset
          legend=<Text fw={700}>List of data contributors</Text>
          mt="md"
        >
          <ContributorTable contributors={contributors} />
        </Fieldset>
      </Container>
    </>
  );
};

export const dynamic = "force-dynamic";

export default Home;
