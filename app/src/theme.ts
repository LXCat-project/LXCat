// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

// The ChemCat green.
const brand: MantineColorsTuple = [
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
];

const fontFamily =
  "var(--font-inter), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif";

export const theme = createTheme({
  colors: { brand },
  primaryColor: "brand",
  // White text on shade 7 has a contrast of only 3.8:1, on shade 8 it is 5:1.
  primaryShade: { light: 8, dark: 8 },
  fontFamily,
  headings: { fontFamily },
  defaultRadius: "md",
});

/**
 * Dark mode adjustments:
 * - Mantine darkens shade 9 of a colour to get its `light` variant (light
 *   buttons, subtle hover, selected table rows, ...). For our navy brand
 *   colour that is nearly black on the dark body background, so use a
 *   translucent tint of a lighter shade instead. Other colours keep Mantine's
 *   defaults.
 * - The body text is white (like the light mode text is black) instead of
 *   Mantine's grey, which looks washed out. Dimmed text stays grey.
 */
const tint = (percentage: number) =>
  `color-mix(in srgb, var(--mantine-color-brand-4) ${percentage}%, transparent)`;

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    "--mantine-color-text": "var(--mantine-color-white)",
    "--mantine-color-brand-light": tint(30),
    "--mantine-color-brand-light-hover": tint(40),
  },
});
