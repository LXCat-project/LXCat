// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "@mantine/core/styles.css";
import "mantine-datatable/styles.css";
import "../styles/globals.css";

import { ColorSchemeScript } from "@mantine/core";
import ErrorBoundary from "../shared/error-boundary";
import { NavBar } from "../shared/nav-bar";
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
