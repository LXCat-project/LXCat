<!--
SPDX-FileCopyrightText: LXCat team

SPDX-License-Identifier: Apache-2.0
-->

# @lxcat/schema

[![codecov](https://codecov.io/gh/LXCat-project/LXCat/graph/badge.svg?flag=schema)](https://codecov.io/gh/LXCat-project/LXCat?flags[0]=schema)

Package with JSON schemas, validator and Typescript types of LXCat documents.

LXCat is an open-access website for collecting, displaying, and downloading
electron and ion scattering cross sections for modeling low temperature plasmas.

The validation is multi-step, first the input is checked against a JSON schema
and then the quantum numbers of the members of the input reactions are checked.

## Installation

```shell
bun install @lxcat/schema
```

## Usage

To get Typescript type for a LXCat Cross Section Set

```ts
import type { CrossSectionSetRaw } from "@lxcat/schema/dist/css/inpu";
```

To get JSON schema for a LXCat Cross Section Set

```js
import schema from "@lxcat/schema/dist/css/CrossSectionSetRaw.schema.json";
```

(your tsconfig should be configured for
[JSON imports](https://www.typescriptlang.org/tsconfig#resolveJsonModule))

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
bun --filter=@lxcat/schema install
```

### Generate JSON schemas

The JSON schemas (`src/**/*.schema.json` files) can be generated with

```shell
bun json
```

Whenever the types from which the schemas are derived are changed then this
command should be run.

## Tests

See [code contributor doc](../docs/code-contributor#unit-tests).

## API documentation

API documentation can be generated using [typedoc](https://typedoc.org/) with

```shell
bunx typedoc --entryPointStrategy expand src
```

A `docs/index.html` should have been written.

<!--
TODO put API documentation on GitLab pages
-->

## Publishing

To publish `@lxcat/schema` to npmjs.com perform the following steps:

1. Change directory to `packages/schema/package.json`.
1. Set version in `packages/schema/package.json` with `bun pm version <patch|minor|major>`
1. Commit and push changes to main branch
1. Make sure you are logged in on npm by checking with
   `bun whoami --scope lxcat` and optionally login in with
   `bunx npm login --scope lxcat --publish`
1. Make sure `bun dev` is not running
1. Clean dist/ with `bun clean`
1. Publish with `bun publish --otp <otp code>`
1. Create git tag for version with
   `git tag @lxcat/schema@<value at packages/schema/package.json:version>` and
   `git push origin --tags`
