// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { enum as zEnum, object } from "zod";

export const MolecularParity = object({ parity: zEnum(["g", "u"]) });
