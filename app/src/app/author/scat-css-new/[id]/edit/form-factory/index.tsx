// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  Box,
  Group,
  MantineTheme,
  NumberInput,
  Select,
  Stack,
  Sx,
  Text,
  TextInput,
} from "@mantine/core";
import assert from "assert";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import { useFormContext } from "../edit-form";
import { AnyOf } from "./any-of";

const listStyle: Sx = (theme: MantineTheme) => ({
  padding: theme.spacing.xs,
  borderStyle: "solid",
  borderRadius: theme.radius.md,
  borderColor: theme.colors.gray[4],
  borderWidth: "thin",
});

export const SpeciesForm = (
  { typeMap, basePath }: {
    typeMap: Record<string, React.ReactNode>;
    basePath: string;
  },
) => {
  const context = useFormContext();
  const { getInputProps } = context;

  return (
    <Stack spacing={1}>
      <Group>
        <TextInput
          label="Particle"
          {...getInputProps(`${basePath}.particle`)}
        />
        <NumberInput
          label="Charge"
          {...getInputProps(`${basePath}.charge`)}
        />
      </Group>
      <Select
        label="Type"
        data={Object.keys(typeMap).map((type) => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        }))}
        {...getInputProps(`${basePath}.type`)}
      />
      {typeMap[getInputProps(`${basePath}.type`).value]}
    </Stack>
  );
};

export const capitalizeFirst = (word: string) =>
  word.length > 1 ? word.charAt(0).toUpperCase() + word.slice(1) : word;

export const isSchemaObject = (
  schemaDefinition: JSONSchema7Definition,
) => {
  assert(typeof schemaDefinition !== "boolean");
  return schemaDefinition;
};

export const PropertyBox = (
  { label, children }: { label?: string; children: React.ReactNode },
) => (
  label
    ? (
      <Stack spacing={1}>
        <Text>{capitalizeFirst(label)}</Text>
        <Box sx={listStyle}>{children}</Box>
      </Stack>
    )
    : <Box sx={listStyle}>{children}</Box>
);

export const generateSpeciesForm = (
  speciesSchema: JSONSchema7,
  basePath: string,
) =>
  Object.fromEntries(speciesSchema.anyOf!.map((speciesDefinition) => {
    const speciesObject = isSchemaObject(speciesDefinition);
    const key = isSchemaObject(speciesObject.properties!.type).const! as string;

    return [
      key,
      <SchemaForm
        key={key}
        schema={speciesObject}
        formPath={basePath}
        propertyName={key}
      />,
    ];
  }));

export type SchemaFormProps = {
  schema: JSONSchema7;
  formPath: string;
  propertyName?: string;
  drawBorder?: boolean;
};

type SchemaNumberInputProps = Omit<SchemaFormProps, "drawBorder">;
const SchemaNumberInput = (
  { schema, formPath, propertyName }: SchemaNumberInputProps,
) => {
  const { getInputProps } = useFormContext();

  return (
    <NumberInput
      min={schema.minimum}
      step={schema.multipleOf}
      precision={schema.multipleOf && 1}
      label={propertyName!}
      {...getInputProps(formPath)}
    />
  );
};

export const SchemaForm = (
  { schema, formPath, propertyName, drawBorder }: SchemaFormProps,
): React.ReactNode => {
  const context = useFormContext();
  const { getInputProps } = context;

  if (schema.type) {
    if (schema.type === "object") {
      if (schema.properties && Object.keys(schema.properties).length > 0) {
        const objectGroup = (
          <Group>
            {Object.entries(schema.properties).map(([key, value]) => (
              <div key={`${propertyName}:${formPath}.${key}`}>
                <SchemaForm
                  schema={isSchemaObject(value)}
                  formPath={`${formPath}.${key}`}
                  propertyName={key}
                  drawBorder={true}
                />
              </div>
            ))}
          </Group>
        );

        return (
          drawBorder
            ? <PropertyBox label={propertyName}>{objectGroup}</PropertyBox>
            : objectGroup
        );
      }
    } else if (
      schema.type === "array" && schema.items && !Array.isArray(schema.items)
    ) {
      return (
        <SchemaForm
          schema={isSchemaObject(schema.items)}
          formPath={`${formPath}.0`}
          propertyName={propertyName}
          drawBorder={drawBorder}
        />
      );
    } else if (schema.type === "string") {
      if (
        !(propertyName && propertyName === "type")
      ) {
        return (
          <TextInput
            label={propertyName}
            {...getInputProps(formPath)}
          />
        );
      }
    } else if (schema.type === "integer") {
      return (
        <SchemaNumberInput
          schema={schema}
          formPath={formPath}
          propertyName={propertyName}
        />
      );
    } else if (schema.type === "number") {
      return (
        <SchemaNumberInput
          schema={schema}
          formPath={formPath}
          propertyName={propertyName}
        />
      );
    }
  } else if (schema.anyOf) {
    return (
      <AnyOf
        definitions={schema.anyOf}
        formPath={formPath}
        propertyName={propertyName}
      />
    );
  } else if (schema.allOf) {
    const allOfGroup = (
      <Group>
        {schema.allOf.map((def, i) => (
          <SchemaForm
            key={`${def}.${i}`}
            schema={isSchemaObject(def)}
            formPath={formPath}
            propertyName={propertyName}
          />
        ))}
      </Group>
    );
    return (drawBorder
      ? <PropertyBox label={propertyName}>{allOfGroup}</PropertyBox>
      : allOfGroup);
  }

  return <div />;
};
