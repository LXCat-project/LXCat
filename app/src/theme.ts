// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { createTheme, defaultVariantColorsResolver } from "@mantine/core";

export const theme = createTheme({
  colors: {
    brand: [
      "#e5f2ff",
      "#c1d5f1",
      "#9cb9e2",
      "#769dd5",
      "#5181c8",
      "#3867af",
      "#2a5089",
      "#1c3963",
      "#0e223e",
      "#010b1b",
    ],
  },
  primaryColor: "brand",
  variantColorResolver: (input) => {
    const defaultColors = defaultVariantColorsResolver(input);

    if (input.variant === "light") {
      return {
        ...defaultColors,
        background: "var(--mantine-color-brand-0)",
        hover: "var(--mantine-color-brand-1)",
      };
    }

    return defaultColors;
  },
});
