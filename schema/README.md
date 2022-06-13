# @lxcat/schema

Package with JSON schemas and Typescript types of LXCat documents.

## Installation

```shell
npm install @lxcat/schema
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
