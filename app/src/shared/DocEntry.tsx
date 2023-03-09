// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";
import {
  Group,
  Box,
  Collapse,
  UnstyledButton,
  createStyles,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons";
import { DocSection } from "../docs/generator";
import { slug } from "github-slugger";
import { usePathname, useRouter } from "next/navigation";

const useStyles = createStyles((theme) => ({
  control: {
    fontWeight: 500,
    display: "block",
    width: "100%",
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
    fontSize: theme.fontSizes.sm,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[7]
          : theme.colors.gray[0],
      color: theme.colorScheme === "dark" ? theme.white : theme.black,
      textDecoration: "none",
    },
  },

  link: {
    ":hover": {
      textDecoration: "none",
    },
  },

  chevron: {
    transition: "transform 200ms ease",
  },
}));

export interface DocEntryProps {
  fileName: string;
  section: DocSection;
  depth?: number;
}

// FIXME: The Next router does not correctly treat URLs containing a hash: it does navigate to the page, but does not scroll to the desired element. Adding the `component="a"` is a workaround that should be removed once this is resolved.
// An alternative option is to make the top level an accordion.
export function DocEntry({ fileName, section, depth = 0 }: DocEntryProps) {
  const { classes, theme } = useStyles();
  const [opened, setOpened] = useState(false);

  const router = useRouter();
  const pathName = usePathname();

  const sectionSlug = slug(section.title);

  return (
    <>
      <UnstyledButton
        component="a"
        href={!section.children || opened ? `#${sectionSlug}` : "#"}
        onClick={(event) => {
          if (
            (!section.children || !opened) &&
            pathName &&
            !pathName.includes(`/docs/${fileName}`)
          ) {
            router.push(`/docs/${fileName}#${sectionSlug}`);
          }
          if (section.children && opened) {
            event.preventDefault();
          }
          setOpened((opened) => !opened);
        }}
        className={classes.control}
        sx={{
          paddingLeft: 11,
          marginLeft: 0,
        }}
      >
        <Group position="apart" spacing={0}>
          <Box ml="none">{section.title}</Box>
          {section.children && (
            <IconChevronRight
              className={classes.chevron}
              size={14}
              stroke={1.5}
              style={{
                transform: opened
                  ? `rotate(${theme.dir === "rtl" ? -90 : 90}deg)`
                  : "none",
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {section.children ? (
        <Collapse
          sx={{
            borderLeft: `1px dashed ${
              theme.colorScheme === "dark"
                ? theme.colors.dark[4]
                : theme.colors.gray[3]
            }`,
            marginLeft: 21,
          }}
          in={opened}
        >
          {section.children.map((child) => (
            <DocEntry
              key={`${fileName}-${child.title}`}
              fileName={fileName}
              section={child}
              depth={depth + 1}
            />
          ))}
        </Collapse>
      ) : null}
    </>
  );
}
