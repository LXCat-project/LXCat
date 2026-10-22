// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-datatable/styles.css";
import "@/styles/globals.css";
import "highlight.js/styles/github.min.css";

import { DemoAlert } from "@/layout/demo-alert";
import ErrorBoundary from "@/layout/error-boundary";
import { Footer } from "@/layout/footer";
import { NavBar } from "@/layout/header/nav-bar";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { Inter } from "next/font/google";
import { Provider } from "./provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

interface RootLayoutProps {
  children: React.ReactNode;
}

const MyApp = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en-US" className={inter.variable} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Provider>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100dvh",
            }}
          >
            <NavBar />
            <DemoAlert />
            <main style={{ flex: 1 }}>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </Provider>
      </body>
    </html>
  );
};

export default MyApp;
