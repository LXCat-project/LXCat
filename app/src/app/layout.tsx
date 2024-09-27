// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";
import "mantine-datatable/styles.css";
import "@/styles/globals.css";

import { DemoAlert } from "@/shared/demo-alert";
import ErrorBoundary from "@/shared/error-boundary";
import { NavBar } from "@/shared/header/nav-bar";
import { ColorSchemeScript } from "@mantine/core";
import { Provider } from "./provider";

interface RootLayoutProps {
  children: React.ReactNode;
}

const MyApp = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en-US">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Provider>
          <div style={{ boxSizing: "border-box" }}>
            <NavBar />
            <DemoAlert />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </Provider>
      </body>
    </html>
  );
};

export default MyApp;
