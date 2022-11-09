<!--
SPDX-FileCopyrightText: LXCat team

SPDX-License-Identifier: Apache-2.0
-->

# @lxcat/converter

Package with native node module that can convert LXCat JSON documents to legacy
LXCat documents.

## Installation

```shell
npm install @lxcat/converter
```

## Contributing

### Install dependencies
```shell
curl https://sh.rustup.rs -sSf | sh -s -- --default-toolchain stable -y
cd ..
npm install -w converter
cd converter
```

## Tests

Testing uses the native node test runner. Currently, the only tests are for
cases that should succeed. To add such a test, add a directory in
`tests/valid`. This directory should contain an `in.json` file, that conforms
to the `CrossSectionSetRaw` schema definition as defined in `@lxcat/schema`.
Additionally, an `out.txt` should be placed in the same directory. This file
contains the output, in LXCat legacy format, that is expected by the converter.
Finally, the test can be enabled by adding it to `tests/valid.test.ts`.

Run tests with

```shell
npm run test
```
