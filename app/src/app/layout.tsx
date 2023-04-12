// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ErrorBoundary from "../shared/ErrorBoundary";
import { NavBar } from "../shared/NavBar";
import "../styles/globals.css";
import { Provider } from "./provider";

interface RootLayoutProps {
  children: React.ReactNode;
}

const MyApp = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en-US">
      <head />
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
