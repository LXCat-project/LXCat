"use client";

import { TextInput, TextInputProps } from "@mantine/core";
import { useState } from "react";

export type IntegerInputProps =
  & Omit<TextInputProps, "value" | "onChange">
  & {
    value?: number;
    onChange: (value: number) => void | Promise<void>;
  };

export const IntegerInput = (
  { value, onChange, ...rest }: IntegerInputProps,
) => {
  const [text, setText] = useState<string>(value?.toString() ?? "");

  return (
    <TextInput
      {...rest}
      value={text}
      onChange={({ currentTarget: { value } }) => {
        if (value === "") {
          setText("");
          onChange(0);
        } else if (/^\d*e?\+?\d*$/.test(value)) {
          setText(value);

          if (/^\d+(?:e\+?\d+)?$/.test(value)) {
            onChange(parseFloat(value));
          }
        }
      }}
    />
  );
};
