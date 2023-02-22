"use client";

import { AppShell, Navbar } from "@mantine/core";
import { DocFile } from "../../docs/generator";
import { DocEntry } from "../../shared/DocEntry";
import { NavBar } from "../../shared/NavBar";

export const MarkdownLayout = ({
  docFiles,
  children,
}: {
  docFiles: Array<DocFile>;
  children: React.ReactNode;
}) => {
  return (
    <AppShell
      header=<NavBar />
      navbar={
        <Navbar sx={{ zIndex: 10 }} p="xs" width={{ base: 300 }}>
          {docFiles.flatMap((file) =>
            file.entries ? (
              file.entries.map((section) => {
                return (
                  <DocEntry
                    key={`${file.name}-${section.title}`}
                    fileName={file.name}
                    section={section}
                  />
                );
              })
            ) : (
              <></>
            )
          )}
        </Navbar>
      }
    >
      {children}
    </AppShell>
  );
};
