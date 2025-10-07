// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { VersionedLTPDocumentJSONSchema } from "@lxcat/schema/json-schema";
import { okJsonResponse } from "../../../../shared/api-responses";
import { RouteBuilder } from "../../route-builder";

// Route to host JSON schema of LTPDocument.
const router = RouteBuilder
  .init()
  .get(async () => {
    const res = okJsonResponse(VersionedLTPDocumentJSONSchema);
    res.headers.append("Content-Type", "application/schema+json");
    return res;
  })
  .compile();

export { router as GET };
