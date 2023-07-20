// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const MolecularParity = z.object({ parity: z.enum(["g", "u"]) });
