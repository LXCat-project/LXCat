<!--
SPDX-FileCopyrightText: LXCat team

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Database

[![codecov](https://codecov.io/gh/LXCat-project/LXCat/graph/badge.svg?flag=database)](https://codecov.io/gh/LXCat-project/LXCat?flags[0]=database)

The web application needs an [ArangoDB](https://arangodb.com/) database to talk
to. This package provides a data abstraction layer for the application to the
database.

## Run for development

Create `.env.development` at the root of this repository, with the following
content:

```shell
# Optional: URL of the ArangoDB api; usually left as default: http://localhost:8529.
ARANGO_URL=<URL>
# Optional: Name of the database that hosts LXCat related data. Default: `lxcat`.
ARANGO_DB=<Database name>
# Optional: Name of the restricted ArangoDB user used by `app` to communicate to the database. Default: `lxcat`.
ARANGO_USERNAME=<Username>
# Password used by the `ARANGO_USERNAME` user to connect to database
ARANGO_PASSWORD=<ArangoDB `app` user password>
# ArangoDB root password.
ARANGO_ROOT_PASSWORD=<Arangodb root password>
```

Spin up a database container, referencing `.env.development`, bind-mounting
`./arangodb3` to `/var/lib/arangodb3`, and exposing chosen ArangoDB API port
(`8529` by default). Note that all shell commands should be run from the current
directory (`/packages/database`).

```shell
docker run --rm --volume $PWD/arangodb3:/var/lib/arangodb3 --env-file ../../.env.development -p 8529:8529 arangodb/arangodb:3.12.0
```

The `./arangodb3` directory is used to persist the collection data. The
container will listen on [http://localhost:8529](http://localhost:8529) (or the
value of `ARANGO_URL` if set).

After setting up the database (see the next section), the ArangoDB dashboard
(built-in admin web interface) can be accessed in a web browser by visiting
[http://localhost:8529](http://localhost:8529) and login with `ARANGO_USERNAME`
as username and value of `ARANGO_PASSWORD` environment variable as password and
select `lxcat` (or value of ARANGO_DB environment variable if set) as DB.

## Setup

To create the database, create the `ARANGO_USERNAME` user, and setup the
collections run the following command:

```shell
# First install all dependencies and build the JSON schemas
pnpm install && pnpm -C ../schema build
pnpm run setup
```

## Seeding with test data

The app requires some collections to be filled. This can be done by writing
scripts inside a directory for example `seeds/test/` and running:

```shell
pnpm seed seeds/test
```

This will create a number of dummy documents in the database.

## Creating own seed

To create your own seed data you should create a directory with scripts. Each
script file is a Typescript file which will be executed.

To get a
[ArangoJS Database object](https://arangodb.github.io/arangojs/7.7.0/classes/database.database-1.html)
to perform database queries import `db` from the app use the following imports:

```ts
import "dotenv/config";
import { db } from "../../src/db";
```

The code must be wrapped inside an async function which is exported as default:

```ts
export default async function() {
  // Call await here
  // For example:
  // const names = await db.listDatabases();
}
```

To perform
[schema validation](https://www.arangodb.com/docs/3.8/data-modeling-documents-schema-validation.html)
on a collection, you can import a JSON schema from the app with

```ts
import { UserJsonSchema } from "../../app/src/auth/schema";
```

To make sure the scripts are executed in the correct order when using `*`, name
the scripts in an alphanumerically sorted way.

To run the scripts use

```sh
pnpm seed <a directory with Typescript files (*.ts) that fill the database>
```

### Load directory of cross section set JSON documents

Instead of writing seed scripts you can also load a directory of cross section
set JSON documents with

```shell
pnpm load-css <a directory with cross section set JSON documents>
```

> When runnning command with Docker, make sure the desired directory is readable
> inside the container.

## Make user an admin

Some pages require the user to have a certain role. To assign new roles to user
can be done on `/admin` page, but you need to have the `admin` role to access
the page.. Therefore, there is a chicken and egg problem to access the page. To
mitigate this, the admin role can also be assigned to a user that has already
logged in once by running following command

```sh
pnpm make-admin <email of user>
```

## Start over

> Dangerous! These commands will wipe everything in the database

To start over the whole database can be dropped with

```sh
pnpm drop-database
```

To start over and fill the database with the test seed use

```sh
pnpm reload
```

## Make usable for app

```shell
pnpm build
```

## Tests

See [code contributor doc](../../docs/code-contributor#unit-tests)

The tests are done against a database running in a container using the
[testcontainers](https://github.com/testcontainers/testcontainers-node) library.
