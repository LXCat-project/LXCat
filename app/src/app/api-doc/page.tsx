// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generateOpenAPI } from "@/docs/openapi";
// import { openapiGenerator } from "@/openapi";
import { DocsPageClient } from "./page-client";

export default async function DocsPage() {
  const spec = await generateOpenAPI();
  // const spec = openapiGenerator.generate({
  //   info: {
  //     version: "0.0.1",
  //     title: "LXCat API",
  //     description: "API for working with LXCat data.",
  //   },
  //   servers: [{ url: "" }],
  // });
  return <DocsPageClient spec={spec} />;
}
