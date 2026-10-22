// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Container } from "@mantine/core";
import { DocFile } from "../../docs/generator";
import { DocsMobileNav, DocsSidebar } from "./sidebar";

import classes from "./docs.module.css";

export const MarkdownLayout = ({
  docFiles,
  children,
}: {
  docFiles: Array<DocFile>;
  children: React.ReactNode;
}) => {
  return (
    <Container size="xl">
      <div className={classes.layout}>
        <DocsSidebar docFiles={docFiles} />
        <div className={classes.main}>
          <DocsMobileNav docFiles={docFiles} />
          {children}
        </div>
      </div>
    </Container>
  );
};
