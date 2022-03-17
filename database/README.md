# Database

The web application needs an [arangodb](https://arangodb.com/) database to talk to.

## Run for development

Create `..env` file with

```shell
ARANGO_ROOT_PASSWORD=<arangodb root password used for Docker container and migrations>
```

Build Docker image for database with

```shell
docker build -t lxcat/database .
```

Spin up a database container.

```shell
docker run --rm --volume $PWD/arangodb3:/var/lib/arangodb3 --env-file .env -p 8529:8529 lxcat/database
```

The `./orangodb3` directory is used to persist the collection data.
The container will listen on [http://localhost:8529](http://localhost:8529).

Perform migrations to create collections and fill them with

```shell
npm install
npx arango-migrate -u
```

## Seeding

The app requires collections aka tables to exist and some collections to be filled.
