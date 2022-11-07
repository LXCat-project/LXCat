<!--
SPDX-FileCopyrightText: LXCat developer team

SPDX-License-Identifier: Apache-2.0
-->

# @lxcat/schema

Package with JSON schemas, validator and Typescript types of LXCat documents.

## Installation

```shell
npm install @lxcat/schema
```

## Usage

To get Typescript type for a LXCat Cross Section Set

```ts
import type { CrossSectionSetRaw } from '@lxcat/schema/dist/css/input
```

To get JSON schema for a LXCat Cross Section Set

```js
import schema from "@lxcat/schema/dist/css/CrossSectionSetRaw.schema.json";
```

(your tsconfig should be confgured for [JSON imports](https://www.typescriptlang.org/tsconfig#resolveJsonModule))

To validate a LXCat Cross Section Set document

```js
import { Validator } from '@lxcat/schema/dist/css/validate'

const validator = new Validator()

// Some JSON document to validate
const doc = ...

if (validator.validate(doc)) {
    // is valid
    // doc is now of type CrossSectionSetRaw which can be imported with
} else {
    console.log(validator.errors)
    // List of validation errors in format of https://ajv.js.org/api.html#validation-errors
}
```

## Contributing

### Install dependencies

```shell
cd ..
npm run install -w schema
cd schema
```

### Generate JSON schemas

The JSON schemas (`src/**/*.schema.json` files) can be generated with

```shell
npm run json
```

Whenever the types from which the schemas are derived are changed then this command should be run.

## Tests

See [code contributor doc](../docs/code-contributor#unit-tests).

## API documentation

API documentation can be generated using [typedoc](https://typedoc.org/) with

```shell
npx typedoc --entryPointStrategy expand src
```

A `docs/index.html` should have been written.

<!--
TODO put API documentation on GitLab pages
-->
