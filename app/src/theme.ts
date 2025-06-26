// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { createTheme, defaultVariantColorsResolver } from "@mantine/core";

export const theme = createTheme({
  colors: {
    brand: [
      "#eef9f1",
      "#e1eee5",
      "#c2daca",
      "#a0c6ac",
      "#84b493",
      "#71aa83",
      "#67a57a",
      "#559068",
      "#467a57",
      "#3a6f4c",
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
