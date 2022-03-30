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
docker run --rm --volume $PWD/arangodb3:/var/lib/arangodb3 --env-file .env -p 8529:8529 arangodb/arangodb:3.9.0
```

The `./orangodb3` directory is used to persist the collection data.
The container will listen on [http://localhost:8529](http://localhost:8529).

## Filling the database with scripts

Each script file is a Typescript file which will be executed.

To get a [ArangoJS Database object](https://arangodb.github.io/arangojs/7.7.0/classes/database.database-1.html) to perform database queries import `db` from the app use the following imports:

```ts
import 'dotenv/config'
import { db } from '../../app/src/db'
```

To use await you must wrap code inside an [IIFE (Immediately Invoked Function Expression)](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) like

```ts
(async () => {
    // Call await here
    // For example:
    // const names = await db.listDatabases();
})();
```

To perform [schema validation](https://www.arangodb.com/docs/3.8/data-modeling-documents-schema-validation.html) on a collection, you can import a JSON schema from the app with

```ts
import { UserJsonSchema } from '../../app/src/auth/schema'
```

To make sure the scripts are executed in the correct order when using `*`, name the scripts in an alphanumerically sorted way.

## Setup

To create database and create all empty collections run following command:

```shell
npm install
# To run all setup/*.ts files
npm run setup
```

## Seeding

The app requires some collections to be filled.
This can be done by writing scripts inside a directory for example `seeds/testdemo/` and running:

```shell
npm run seed seeds/test
```

## Setup & seed from Docker

Build container with

```shell
docker build -t lxcat/dbimport -f database/Dockerfile .
```

All files to import must be available within container so you must copy or mount the directory inside the container.
