// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getTopLevelSpecies } from "@lxcat/database/dist/shared/queries/species";
import { NextResponse } from "next/server";
import { RouteBuilder } from "../route-builder";

const router = RouteBuilder
  .init()
  .get(async () => NextResponse.json(await getTopLevelSpecies()))
  .compile();

export { router as GET };
