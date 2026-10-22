// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import type { Layout, LayoutAxis } from "plotly.js-basic-dist";

export interface PlotTheme {
  /** Layout options for the active color scheme, to be spread into a layout. */
  layout: Partial<Layout>;
  /** Options to be spread into every axis of the layout. */
  axis: Partial<LayoutAxis>;
  /** The color of the outline of the markers, dark in both color schemes. */
  markerOutline: string;
}

/**
 * Colors for a Plotly plot that match the color scheme of the app. In light
 * mode Plotly's default colors are kept.
 */
export const usePlotTheme = (): PlotTheme => {
  const theme = useMantineTheme();
  // The plots are only rendered on the client, so the OS color scheme can be
  // read during the first render instead of in an effect, which would flash
  // the light theme when the scheme is "auto".
  const colorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: false,
  });

  const markerOutline = theme.black;
  // Two decimals in scientific notation, as the values span many magnitudes.
  const hoverformat = ".2e";

  if (colorScheme === "light") {
    return { layout: {}, axis: { hoverformat }, markerOutline };
  }

  // The background is opaque and equal to the page, so exported images are
  // consistent with what is shown.
  const background = theme.colors.dark[7];
  const grid = "rgba(255, 255, 255, 0.1)";

  return {
    markerOutline,
    layout: {
      paper_bgcolor: background,
      plot_bgcolor: background,
      font: { color: theme.white },
      hoverlabel: {
        bgcolor: theme.colors.dark[6],
        bordercolor: theme.colors.dark[4],
        font: { color: theme.white },
      },
      modebar: {
        bgcolor: "transparent",
        color: theme.colors.dark[1],
        activecolor: theme.white,
      },
    },
    axis: {
      hoverformat,
      gridcolor: grid,
      zerolinecolor: grid,
      linecolor: theme.colors.dark[2],
      tickcolor: theme.colors.dark[2],
    },
  };
};
