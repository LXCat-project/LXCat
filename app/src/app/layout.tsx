// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
        <Provider>{children}</Provider>
      </body>
    </html>
  );
};

export default MyApp;
