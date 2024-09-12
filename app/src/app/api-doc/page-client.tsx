// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { RedocStandalone } from "redoc";

export function DocsPageClient({ spec }: { spec: any }) {
  const url = "/api/doc/";
  return (
    <section className="container">
      <RedocStandalone spec={spec} />
    </section>
  );
}
