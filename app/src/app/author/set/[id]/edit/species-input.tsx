// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { MaybePromise } from "@/app/api/util";
import { JsonInput } from "@mantine/core";
import { useState } from "react";

type SpeciesInputProps = {
  initialState: any;
  onChange: (state: any) => MaybePromise<void>;
};

export const SpeciesInput = ({ initialState, onChange }: SpeciesInputProps) => {
  const [value, setValue] = useState<string>(JSON.stringify(initialState));
  const [error, setError] = useState<string>();

  const setState = (stateString: string) => {
    setValue(stateString);

    let state;

    try {
      state = JSON.parse(stateString);
    } catch (_) {
      setError("Invalid JSON");
      return;
    }

    onChange(state);
    setError(undefined);
  };

  return (
    <JsonInput
      label="Species definition"
      autosize
      value={value}
      onChange={setState}
      error={error}
    />
  );
};
