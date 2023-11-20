// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "@mantine/core/styles.css";
import "mantine-datatable/styles.css";

import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import { theme } from "../theme";

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <MantineProvider theme={theme}>
        {children}
      </MantineProvider>
    </SessionProvider>
  );
};
