// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatDatabase } from "../lxcat-database.js";
import { systemDb } from "../systemDb.js";

await LXCatDatabase.create(systemDb(), "lxcat");
