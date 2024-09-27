// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { RedocStandalone } from "redoc";

export function DocsPageClient({ spec }: { spec: any }) {
  return (
    <section className="container" style={{ marginTop: 10 }}>
      <RedocStandalone options={{ scrollYOffset: 30 }} spec={spec} />
    </section>
  );
}
