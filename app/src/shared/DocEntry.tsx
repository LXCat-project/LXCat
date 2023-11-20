// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  Box,
  Collapse,
  Group,
  UnstyledButton,
  useDirection,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { slug } from "github-slugger";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DocSection } from "../docs/generator";
import classes from "./doc-entry.module.css";

export interface DocEntryProps {
  fileName: string;
  section: DocSection;
  depth?: number;
}

// FIXME: The Next router does not correctly treat URLs containing a hash: it does navigate to the page, but does not scroll to the desired element. Adding the `component="a"` is a workaround that should be removed once this is resolved.
// An alternative option is to make the top level an accordion.
export function DocEntry({ fileName, section, depth = 0 }: DocEntryProps) {
  const [opened, setOpened] = useState(false);
  const direction = useDirection();

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
            (!section.children || !opened)
            && pathName
            && !pathName.includes(`/docs/${fileName}`)
          ) {
            router.push(`/docs/${fileName}#${sectionSlug}`);
          }
          if (section.children && opened) {
            event.preventDefault();
          }
          setOpened((opened) => !opened);
        }}
        className={classes.control}
        style={{
          paddingLeft: 11,
          marginLeft: 0,
        }}
      >
        <Group justify="apart" gap={0}>
          <Box ml="none">{section.title}</Box>
          {section.children && (
            <IconChevronRight
              className={classes.chevron}
              size={18}
              stroke={1.5}
              style={{
                transform: opened
                  ? `rotate(${direction.dir === "rtl" ? -90 : 90}deg)`
                  : "none",
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {section.children
        ? (
          <Collapse
            style={{
              borderLeft: `1px dashed ${theme.colors.gray[3]}`,
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
        )
        : null}
    </>
  );
}
