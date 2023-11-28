// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import dotenv from "dotenv";

if (process.env.LXCAT_BUILD_ENV !== "production") {
  dotenv.config({ path: "../../.env.development" });
}
