// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MantineProvider } from "@mantine/core";
import { theme } from "../theme";
import { SessionProvider } from "./auth-provider";

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <MantineProvider theme={theme}>
        {children}
      </MantineProvider>
    </SessionProvider>
  );
};
