// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

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

export const theme = createTheme({
  colors: { brand },
  primaryColor: "brand",
});
