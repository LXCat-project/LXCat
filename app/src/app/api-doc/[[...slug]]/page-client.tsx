// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { RedocStandalone } from "redoc";

export function DocsPageClient({ spec }: { spec: any }) {
  // Redoc routes every tag and operation to its own path below `basePath`,
  // hence the optional catch-all route segment. `scrollYOffset` matches the
  // height of the sticky nav bar, so that Redoc's sticky sidebar is not hidden
  // behind it.
  return (
    <section className="container" style={{ marginTop: 10 }}>
      <RedocStandalone
        basePath="/api-doc"
        options={{ scrollYOffset: 60 }}
        spec={spec}
      />
    </section>
  );
}
