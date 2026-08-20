// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#eaf5ff",
  "#dae6f7",
  "#b7cae5",
  "#90acd4",
  "#6e91c4",
  "#5b82bc",
  "#4f7ab9",
  "#3f69a4",
  "#345d94",
  "#255084",
];

export const theme = createTheme({
  colors: { brand },
  primaryColor: "brand",
});
