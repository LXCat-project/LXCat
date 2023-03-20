// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { SessionProvider } from "next-auth/react";
import RootStyleRegistry from "./emotion";

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <RootStyleRegistry>{children}</RootStyleRegistry>
    </SessionProvider>
  );
};
