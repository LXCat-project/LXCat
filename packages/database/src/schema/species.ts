// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnySpecies, StateSummary } from "@lxcat/schema/species";
import { object, TypeOf } from "zod";

export const SerializedSpecies = object({
  detailed: AnySpecies,
  serialized: StateSummary,
});
export type SerializedSpecies = TypeOf<typeof SerializedSpecies>;
