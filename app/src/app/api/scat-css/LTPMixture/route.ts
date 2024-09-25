// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { okJsonResponse } from "@/shared/api-responses";
import { LTPMixtureJSONSchema } from "@lxcat/schema/json-schema";
import { RouteBuilder } from "../../route-builder";

// Route to host JSON schema of LTPMixture.
const router = RouteBuilder
  .init()
  .get(async () => {
    let res = okJsonResponse(LTPMixtureJSONSchema);
    res.headers.append("Content-Type", "application/schema+json");
    return res;
  })
  .compile();

export { router as GET };
