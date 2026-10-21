// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useComputedColorScheme } from "@mantine/core";
import cx from "clsx";
import { useEffect } from "react";
import { RedocStandalone } from "redoc";
import classes from "./page-client.module.css";

const REDOC_COLOR_MODES = ["light", "dark"];

export function DocsPageClient({ spec }: { spec: any }) {
  const colorScheme = useComputedColorScheme("light");

  // Redoc keeps its own color mode and styles itself through a `light` or
  // `dark` class on <html>. Make the color scheme toggle of the nav bar the
  // single source of truth by mirroring Mantine's color scheme onto that class,
  // and hide the toggle of Redoc itself (see the CSS module).
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (!root.classList.contains(colorScheme)) {
        root.classList.remove(...REDOC_COLOR_MODES);
        root.classList.add(colorScheme);
      }
    };
    apply();
    try {
      // The mode that Redoc starts with on the next page load.
      localStorage.setItem("redoc.colorMode", colorScheme);
    } catch {}
    // Redoc re-applies its own stored mode at times, e.g. on a layout switch.
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      root.classList.remove(...REDOC_COLOR_MODES);
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
