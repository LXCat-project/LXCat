// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import NextAuth from "next-auth";
import { options } from "../../../../auth/options";

const router = NextAuth(options);

export { router as GET, router as POST };
