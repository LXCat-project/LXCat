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
import Link from "next/link";
import { useState } from "react";
import classes from "./doc-entry.module.css";
import { DocSection } from "./generator";

export interface DocEntryProps {
  fileName: string;
  section: DocSection;
  depth?: number;
  /** Called after a link without sub-sections was followed. */
  onNavigate?: () => void;
}

export function DocEntry(
  { fileName, section, depth = 0, onNavigate }: DocEntryProps,
) {
  const [opened, setOpened] = useState(false);
  const direction = useDirection();

  const sectionSlug = slug(section.title);

  return (
    <>
      <UnstyledButton
        component={Link}
        href={`/docs/${fileName}#${sectionSlug}`}
        onClick={(event: React.MouseEvent) => {
          if (section.children && opened) {
            // Collapse without navigating.
            event.preventDefault();
          } else if (!section.children) {
            onNavigate?.();
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
            className={classes.collapse}
            expanded={opened}
          >
            {section.children.map((child) => (
              <DocEntry
                key={`${fileName}-${child.title}`}
                fileName={fileName}
                section={child}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </Collapse>
        )
        : null}
    </>
  );
}
