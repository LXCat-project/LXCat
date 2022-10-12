import { Menu, Button, Group } from "@mantine/core";
import { IconSelector } from "@tabler/icons";
import React from "react";

import { Latex } from "./Latex";

interface SelectProps {
  choices: Record<string, string>;
  value?: string;
  onChange: (newValue: string) => void;
  name?: string;
}

export const LatexSelect = ({ choices, value, onChange, name }: SelectProps) => {
  return (
    <Menu>
      <Menu.Target>
        <Button
          variant="default"
          sx={() => ({ paddingLeft: 10, paddingRight: 10 })}
          name={name}
        >
          <Group position="apart" spacing="sm">
            <Latex>{value ? choices[value] : ""}</Latex>
            <IconSelector size={16} color="gray" />
          </Group>
        </Button>
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
