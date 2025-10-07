// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RouteBuilder } from "@/app/api/route-builder";
import { okJsonResponse } from "@/shared/api-responses";
import { NewLTPDocumentJSONSchema } from "@lxcat/schema/json-schema";

// Route to host JSON schema of LTPDocument.
const router = RouteBuilder
  .init()
  .get(async () => {
    const res = okJsonResponse(NewLTPDocumentJSONSchema);
    res.headers.append("Content-Type", "application/schema+json");
    return res;
  })
  .compile();

export { router as GET };
