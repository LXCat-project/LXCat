// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Group, TextInput } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useState, useEffect, useRef } from "react";

interface SchemaSearchProps {
  onSearch: (term: string) => void;
}

export function SchemaSearch({ onSearch }: SchemaSearchProps) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value);
    }, 200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    setValue("");
    onSearch("");
  }; // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TextInput
      leftSection={<IconSearch size="0.9rem" />}
      rightSection={value ? (
        <IconX
          size="0.9rem"
          style={{ cursor: "pointer" }}
          onClick={handleClear}
        />
      ) : null}
      rightSectionPointerEvents="none"
      placeholder="Search schema properties..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      styles={{ input: { maxWidth: 300 } }}
    />
  );
}
