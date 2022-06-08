# Database

The web application needs an [arangodb](https://arangodb.com/) database to talk to.

## Run for development

Create `.env` file inside `database/` directory with

```shell
ARANGO_ROOT_PASSWORD=<arangodb root password that is set inside Docker container>
ARANGO_PASSWORD=<arangodb root password used to connect to Docker container>
```

Spin up a database container.

```shell
docker run --rm --volume $PWD/arangodb3:/var/lib/arangodb3 --env-file .env -p 8529:8529 arangodb/arangodb:3.9.1
```

The `./orangodb3` directory is used to persist the collection data.
The container will listen on [http://localhost:8529](http://localhost:8529).

## Setup

To create database and create all empty collections run following command:

```shell
npm install
cd ../app && npm install && cd -
# To run all setup/*.ts files
npm run setup
```

## Seeding with test data

The app requires some collections to be filled.
This can be done by writing scripts inside a directory for example `seeds/test/` and running:

```shell
npm run seed seeds/test
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
npm run seed <a directory with Typescript files (*.ts) that fill the database>
```

### Load directory of cross section set JSON documents

Instead of writing seed scripts you can also load a directory of cross section set JSON documents with

```shell
npm run load-css <a directory with cross section set JSON documents>
```

> When runnning command with Docker, make sure directory is readable inside container.

## Make user an admin

Some pages require the user to have a certain role.
To assign new roles to user can be done on `/admin` page, but you need to have the `admin` role to access the page..
There is a chicken and the egg problem to access the page.

The admin role can also be assigned to a user that has already logged in once by running following command

```sh
npm run make-admin <email of user>
```

## Start over

> Dangerous! These commands will wipe everything in the database

To start over the whole database can be dropped with

```sh
npm run drop-database
```

To start over and fill database with test seed use

```sh
npm run reload
```
