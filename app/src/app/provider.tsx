// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CodeHighlightProvider } from "@/shared/code-highlight-provider";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { theme } from "../theme";
import { SessionProvider } from "./auth-provider";

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <MantineProvider theme={theme}>
        <Notifications />
        <CodeHighlightProvider>
          <ModalsProvider>
            {children}
          </ModalsProvider>
        </CodeHighlightProvider>
      </MantineProvider>
    </SessionProvider>
  );
};
