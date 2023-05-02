"use client";

import { TextInput, TextInputProps } from "@mantine/core";
import { useState } from "react";

export type ScientificInputProps =
  & Omit<TextInputProps, "value" | "onChange">
  & {
    value?: number;
    onChange: (value: number | undefined) => void | Promise<void>;
  };

export const ScientificInput = (
  { value, onChange, ...rest }: ScientificInputProps,
) => {
  const [text, setText] = useState<string>(value?.toString() ?? "");

  return (
    <TextInput
      {...rest}
      value={text}
      onChange={({ currentTarget: { value } }) => {
        if (value === "") {
          setText("");
          onChange(undefined);
        } else if (/^\d*\.?\d*e?[\-\+]?[0-9]*$/.test(value)) {
          setText(value);

          if (/^\d+(?:\.\d+)?(?:e[\-\+]?[0-9]+)?$/.test(value)) {
            onChange(parseFloat(value));
          }
        }
      }}
    />
  );
};
