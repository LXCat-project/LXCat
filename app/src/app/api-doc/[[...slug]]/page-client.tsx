// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useComputedColorScheme } from "@mantine/core";
import cx from "clsx";
import { useEffect } from "react";
import { RedocStandalone } from "redoc";
import classes from "./page-client.module.css";

export function DocsPageClient({ spec }: { spec: any }) {
  const colorScheme = useComputedColorScheme("light");

  // Redoc styles itself through a `light` or `dark` class on <html>, set from a
  // color mode of its own that it re-applies on any change of its internal
  // state. Keep that class in line with the color scheme toggle of the nav bar,
  // and hide the toggle of Redoc itself (see the CSS module).
  useEffect(() => {
    const root = document.documentElement;
    // toggle() with `force` only mutates on a change, so the observer settles.
    const apply = () => {
      root.classList.toggle("light", colorScheme === "light");
      root.classList.toggle("dark", colorScheme === "dark");
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      root.classList.remove("light", "dark");
    };
  }, [colorScheme]);

  // Redoc routes every tag and operation to its own path below `basePath`,
  // hence the optional catch-all route segment. `scrollYOffset` matches the
  // height of the sticky nav bar, so that Redoc's sticky sidebar is not hidden
  // behind it.
  return (
    <section
      className={cx("container", classes.redoc)}
      style={{ marginTop: 10 }}
    >
      <RedocStandalone
        basePath="/api-doc"
        options={{ scrollYOffset: 60, disableTelemetry: true }}
        spec={spec}
      />
    </section>
  );
}
