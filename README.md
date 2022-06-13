# LXCat Next Generation

An open-access website for collecting, displaying, and downloading electron and ion scattering cross sections for modeling low temperature plasmas.

## Installation

To get familiar with the code read the following documentation:

- [docs/code-contributor.md](docs/code-contributor.md) for technology choices.
- [database/README.md](database/README.md) for spinning up the database and filling it.
- [app/README.md](app/README.md) for web application and web service
- [schema/README.md](schema/README.md) for JSON schemas and Typescript types of LXCat documents

## Documentation

Documentation for different users can be found at [docs/](docs/).

## Production deployment

Create `.env` file with content similar to `.env.local` described in [app/README.md](app/README.md).

Startup containers with

```shell
docker-compose up --build
```

Fill database with

```shell
docker-compose run setup setup
# To seed db with test data set use
docker-compose run setup seed seeds/test
# To seed db with production data use
# The `./database/seeds` directory is bind mounted inside the Docker container,
# so copy any seed files to that directory
cp -r <production data seed> ./database/seeds/<production data seed>
docker-compose run setup seed seeds/<production data seed>
# To give an already logged in user admin rights
docker-compose run setup make-admin <email of user>
```

Web application will run at `http://localhost:3000`.
The app should be reversed proxied by a web server to provide https.
