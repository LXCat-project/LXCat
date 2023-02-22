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
