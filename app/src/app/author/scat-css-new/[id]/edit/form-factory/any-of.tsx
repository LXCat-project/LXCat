// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Group, NativeSelect, Radio, Select, Stack } from "@mantine/core";
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

  console.log(definitions);
  console.log(getInputProps(`meta.${formPath}`).value);

  const element = (
    <Stack>
      {
        <Select
          label="Type"
          data={
            // definitions.map((_, i) => ({
            //     value: i.toString(),
            //     data: i.toString(),
            //   }))
            [{ value: "0", data: "0" }]
          }
          {...getInputProps(`meta.${formPath}`)}
        />
      }
      {
        // getInputProps(`meta.${formPath}`).value
        //   && (
        //     <SchemaForm
        //       schema={isSchemaObject(
        //         definitions[parseInt(getInputProps(`meta.${formPath}`).value)],
        //       )}
        //       formPath={formPath}
        //       propertyName={propertyName}
        //       drawBorder={false}
        //     />
        //   )
      }
    </Stack>
  );

  return <PropertyBox label={propertyName}>{element}</PropertyBox>;
};
