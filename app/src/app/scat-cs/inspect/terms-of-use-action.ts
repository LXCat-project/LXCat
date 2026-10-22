// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { TERMS_OF_USE_COOKIE_NAME } from "@/shared/download";
import { cookies } from "next/headers";

// TODO determine good max age
const MAX_AGE = 24 * 60 * 60; // 1 day in seconds

/**
 * Remember that the visitor agreed to the terms of use.
 *
 * The cookie is only used to hide the terms of use dialog, so it has to be
 * readable by the client and does not grant any access.
 */
export async function acceptTermsOfUseAction() {
  (await cookies()).set(TERMS_OF_USE_COOKIE_NAME, "accepted", {
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });
}
