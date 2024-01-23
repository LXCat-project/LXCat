// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LTPDocumentJSONSchema } from "@lxcat/schema/json-schema";
import { okJsonResponse } from "../../../../shared/api-responses";
import { RouteBuilder } from "../../route-builder";

// Route to host JSON schema of LTPDocument.
const router = RouteBuilder
  .init()
  .get(async () => {
    let res = okJsonResponse(LTPDocumentJSONSchema);
    res.headers.append("Content-Type", "application/schema+json");
    return res;
  })
  .compile();

export { router as GET };
