import { Menu, Group } from "@mantine/core";
import { IconSelector, IconX } from "@tabler/icons";
import React from "react";

import { Latex } from "./Latex";

interface SelectProps {
  choices: Record<string, string>;
  value?: string;
  onChange: (newValue?: string) => void;
  name?: string;
}

export const LatexSelect = ({ choices, value, onChange }: SelectProps) => {
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
          <Latex>{value ? choices[value] : ""}</Latex>
          {value ? (
            <IconX
              size={14}
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                onChange();
              }}
            />
          ) : (
            <IconSelector size={16} color="gray" />
          )}
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
                : {}
            }
          >
            <Latex>{label}</Latex>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
