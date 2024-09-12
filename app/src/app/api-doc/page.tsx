// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generateOpenAPI } from "@/docs/openapi";
import { DocsPageClient } from "./page-client";

export default async function DocsPage() {
  const spec = await generateOpenAPI();
  return <DocsPageClient spec={spec} />;
}
