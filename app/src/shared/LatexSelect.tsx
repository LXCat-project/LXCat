// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Group, Menu } from "@mantine/core";
import { IconSelector, IconX } from "@tabler/icons-react";

import React from "react";

import { Latex } from "./Latex";

export interface LatexSelectProps {
  choices: Record<string, string>;
  value?: string;
  onChange: (newValue?: string) => void | Promise<void>;
  placeholder?: string;
  clearable?: boolean;
  name?: string;
}

export const LatexSelect = ({
  choices,
  value,
  onChange,
  placeholder,
  clearable,
  name,
}: LatexSelectProps) => {
  return (
    <Menu>
      <Menu.Target>
        <Group
          position="apart"
          spacing="sm"
          sx={(theme) => ({
            cursor: "pointer",
            alignContent: "center",
            height: "100%",
            paddingLeft: 11,
            paddingRight: 10,
            ":hover": {
              backgroundColor: theme.colors.gray[0],
            },
            ":active": {
              backgroundColor: theme.colors.gray[3],
            },
          })}
        >
          {value
            ? <Latex>{value ? choices[value] : ""}</Latex>
            : (
              <Latex sx={(theme) => ({ color: theme.colors.gray[4] })}>
                {placeholder ?? ""}
              </Latex>
            )}
          {value && clearable
            ? (
              <IconX
                size={14}
                color="gray"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onChange();
                }}
              />
            )
            : <IconSelector size={16} color="gray" aria-controls={name} />}
        </Group>
      </Menu.Target>

      <Menu.Dropdown style={{ overflowY: "auto", maxHeight: "15rem" }}>
        {Object.entries(choices).map(([choiceValue, label]) => (
          <Menu.Item
            component="button"
            onClick={() => {
              onChange(choiceValue);
            }}
            key={choiceValue}
            disabled={choiceValue === value}
            sx={(theme) =>
              choiceValue === value
                ? {
                  backgroundColor: theme.colors.brand[5],
                  ":disabled": {
                    color: "white",
                  },
                }
                : {}}
          >
            <Latex>{label}</Latex>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
