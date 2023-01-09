<!--
SPDX-FileCopyrightText: LXCat team

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Database

The web application needs an [ArangoDB](https://arangodb.com/) database to talk to.
This package provides a data abstraction layer for the application to the database.

## Run for development

Create `.env` file inside `packages/database/` directory with

```shell
ARANGO_PASSWORD=<arangodb root password used to connect to Docker container>
ARANGO_ROOT_PASSWORD=<Arangodb root password used to set pw in Docker container>
# To connect to ArangoDB running on URL other then http://localhost:8529 uncomment line below
# ARANGO_URL=<URL where ArangoDB is running>
# To use database other then lxcat uncomment line below
# ARANGO_DB=<database name>
# To connect to ArangoDB with other user then root uncomment line below
# ARANGO_USERNAME=<user name>
```

Spin up a database container.

```shell
docker run --rm --volume $PWD/arangodb3:/var/lib/arangodb3 --env-file .env -p 8529:8529 arangodb/arangodb:3.9.1
```

The `./arangodb3` directory is used to persist the collection data.
The container will listen on [http://localhost:8529](http://localhost:8529).

The ArangoDB dashboard (built-in admin web interface) can be accessed in a web browser by visiting [http://localhost:8529](http://localhost:8529) and login with `root` as username and value of ARANGO_PASSWORD environment variable as password and select `lxcat` (or value of ARANGO_DB environment variable if set) as DB. 

## Setup

To create database and create all empty collections run following command:

```shell
# First install all dependencies and build the JSON schemas
cd pnpm install && pnpm -C ../schema build
pnpm run setup
```

## Seeding with test data

The app requires some collections to be filled.
This can be done by writing scripts inside a directory for example `seeds/test/` and running:

```shell
pnpm seed seeds/test
```

This will create a number of dummy documents in the database.

## Creating own seed

To create your own seed data you should create a directory with scripts.
Each script file is a Typescript file which will be executed.

To get a [ArangoJS Database object](https://arangodb.github.io/arangojs/7.7.0/classes/database.database-1.html) to perform database queries import `db` from the app use the following imports:

```ts
import 'dotenv/config'
import { db } from '../../src/db'
```

The code must be wrapped inside an async function which is exported as default:

```ts
export default async function() {
    // Call await here
    // For example:
    // const names = await db.listDatabases();
}
```

To perform [schema validation](https://www.arangodb.com/docs/3.8/data-modeling-documents-schema-validation.html) on a collection, you can import a JSON schema from the app with

```ts
import { UserJsonSchema } from '../../app/src/auth/schema'
```

To make sure the scripts are executed in the correct order when using `*`, name the scripts in an alphanumerically sorted way.

To run the scripts use

```sh
pnpm seed <a directory with Typescript files (*.ts) that fill the database>
```

### Load directory of cross section set JSON documents

Instead of writing seed scripts you can also load a directory of cross section set JSON documents with

```shell
pnpm load-css <a directory with cross section set JSON documents>
```

> When runnning command with Docker, make sure directory is readable inside container.

## Make user an admin

Some pages require the user to have a certain role.
To assign new roles to user can be done on `/admin` page, but you need to have the `admin` role to access the page..
There is a chicken and the egg problem to access the page.

The admin role can also be assigned to a user that has already logged in once by running following command

```sh
pnpm make-admin <email of user>
```

## Start over

> Dangerous! These commands will wipe everything in the database

To start over the whole database can be dropped with

```sh
pnpm drop-database
```

To start over and fill database with test seed use

```sh
pnpm reload
```

## Make usable for app

```shell
pnpm build
```

## Generate collection schemas

The JSON schemas for the ArangoDB collections are stored as `src/**/*.schema.json` and are generated from Typescript types.
Any time the types change run

```shell
pnpm collectionschema
```

## Tests

See [code contributor doc](../../docs/code-contributor#unit-tests)

The tests are done against a database running in a container using the [testcontainers](https://github.com/testcontainers/testcontainers-node) library.
