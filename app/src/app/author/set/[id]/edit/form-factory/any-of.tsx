// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Stack } from "@mantine/core";
import { JSONSchema7Definition } from "json-schema";
import { useFormContext } from "../edit-form";
import { isSchemaObject, PropertyBox, SchemaForm } from ".";

export const AnyOf = (
  { definitions, formPath, propertyName }: {
    definitions: Array<JSONSchema7Definition>;
    formPath: string;
    propertyName?: string;
    drawBorder?: string;
  },
) => {
  const { getInputProps } = useFormContext();

  const element = (
    <Stack>
      <select
        value={getInputProps(`meta.${formPath}.anyOf`).value}
        onChange={(value) =>
          getInputProps(`meta.${formPath}.anyOf`).onChange(
            value.currentTarget.value,
          )}
      >
        {definitions.map((value, i) => (
          <option key={i} value={i.toString()}>
            {!(typeof (value) === "boolean")
              ? value.description ?? i.toString()
              : i.toString()}
          </option>
        ))}
      </select>
      {getInputProps(`meta.${formPath}.anyOf`).value
        && (
          <SchemaForm
            schema={isSchemaObject(
              definitions[
                parseInt(getInputProps(`meta.${formPath}.anyOf`).value)
              ],
            )}
            formPath={formPath}
            propertyName={propertyName}
            drawBorder={false}
          />
        )}
    </Stack>
  );

  return <PropertyBox label={propertyName}>{element}</PropertyBox>;
};
