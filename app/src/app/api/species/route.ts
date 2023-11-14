// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { NextResponse } from "next/server";
import { RouteBuilder } from "../route-builder";

const router = RouteBuilder
  .init()
  .get(async () => NextResponse.json(await db().getTopLevelSpecies()))
  .compile();

export { router as GET };
