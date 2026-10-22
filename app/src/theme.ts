// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

// Shade 7 is the LXCat navy (#254779) of the legacy website.
const brand: MantineColorsTuple = [
  "#eef3fa",
  "#dbe5f2",
  "#b8cae3",
  "#94aed3",
  "#7195c6",
  "#5a82b8",
  "#3f6aa1",
  "#254779",
  "#1e3b66",
  "#172e50",
];

const fontFamily =
  "var(--font-inter), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif";

export const theme = createTheme({
  colors: { brand },
  primaryColor: "brand",
  // White text on the lighter dark-mode shade 4 has a contrast of only 3:1.
  primaryShade: { light: 7, dark: 6 },
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
