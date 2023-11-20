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
  Text,
  TextInput,
} from "@mantine/core";
import assert from "assert";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import { useFormContext } from "../edit-form";
import { AnyOf } from "./any-of";
import classes from "./form-factory.module.css";

export const SpeciesForm = (
  { typeMap, basePath }: {
    typeMap: Record<string, React.ReactNode>;
    basePath: string;
  },
) => {
  const context = useFormContext();
  const { getInputProps } = context;

  return (
    <Stack gap={1}>
      <Select
        label="Type"
        data={Object.keys(typeMap).map((type) => ({
          value: type,
          label: capitalizeFirst(type),
        }))}
        {...getInputProps(`${basePath}.type`)}
        onChange={(type) => {
          const baseValue = getInputProps(basePath).value;
          if (type === "simple") {
            delete baseValue.electronic;
          } else {
            if (!("electronic" in baseValue)) {
              baseValue.electronic = { config: [], term: {} };
            }
          }
          context.setFieldValue(basePath, baseValue);
          return getInputProps(`${basePath}.type`).onChange(type);
        }}
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
      <Stack gap={1}>
        <Text>{capitalizeFirst(label)}</Text>
        <Box className={classes.list}>{children}</Box>
      </Stack>
    )
    : <Box className={classes.list}>{children}</Box>
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
  schema: JSONSchema7Definition | Array<JSONSchema7Definition>;
  formPath: string;
  propertyName?: string;
  drawBorder?: boolean;
};

type SchemaNumberInputProps = {
  schema: JSONSchema7;
  formPath: string;
  propertyName?: string;
};

const SchemaNumberInput = (
  { schema, formPath, propertyName }: SchemaNumberInputProps,
) => {
  const { getInputProps } = useFormContext();

  return (
    <NumberInput
      min={schema.minimum}
      step={schema.multipleOf}
      decimalScale={schema.multipleOf && 1}
      label={propertyName!}
      {...getInputProps(formPath)}
    />
  );
};

export type SchemaArrayInputProps = {
  elementSchema: JSONSchema7Definition | Array<JSONSchema7Definition>;
  formPath: string;
};

const SchemaArrayInput = (
  { elementSchema, formPath }: SchemaArrayInputProps,
): React.ReactNode => {
  const { getInputProps } = useFormContext();

  const fields = Array.isArray(elementSchema)
    ? elementSchema.map((elementSchema, i) => (
      <SchemaForm
        key={i}
        schema={elementSchema}
        formPath={`${formPath}.${i}`}
      />
    ))
    : getInputProps(formPath).value.map(
      (_: any, i: number) => (
        <SchemaForm
          key={i}
          schema={elementSchema}
          formPath={`${formPath}.${i}`}
          propertyName=""
          drawBorder={false}
        />
      ),
    );

  return fields;
};

export const SchemaForm = (
  { schema, formPath, propertyName, drawBorder }: SchemaFormProps,
): React.ReactNode => {
  const context = useFormContext();
  const { getInputProps } = context;

  if (Array.isArray(schema)) {
    return <SchemaArrayInput elementSchema={schema} formPath={formPath} />;
  }

  schema = isSchemaObject(schema);

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
    } else if (schema.type === "array" && schema.items) {
      return (
        <SchemaArrayInput
          elementSchema={schema.items}
          formPath={formPath}
        />
      );
      // return (
      //   <SchemaForm
      //     schema={isSchemaObject(schema.items)}
      //     formPath={`${formPath}.0`}
      //     propertyName={propertyName}
      //     drawBorder={drawBorder}
      //   />
      // );
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
