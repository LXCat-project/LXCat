// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import z from "zod";
import { LXCatMigrationDocument } from "../migration/migration-document.js";

export const LXCat2MigrationSchema = z.toJSONSchema(LXCatMigrationDocument);
