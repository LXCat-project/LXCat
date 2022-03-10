# Database

The web application needs an [arangodb](https://arangodb.com/) database to talk to.

## Run for development

```shell
cd database
docker run --rm --volume $PWD/arangodb3:/var/lib/arangodb3 --env-file ../app/.env.local -p 8529:8529 arangodb/arangodb:3.9.0
```

The `../app/.env.local` file contains root password for the instance.
The `./orangodb3` directory is used to persist the collection data.
The container will listen on [http://localhost:8529](http://localhost:8529).

## Seeding

The app requires collections aka tables to exist and some collections to be filled.
