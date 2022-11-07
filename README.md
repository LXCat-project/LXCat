<!--
SPDX-FileCopyrightText: LXCat developer team

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# LXCat Next Generation

An open-access website for collecting, displaying, and downloading electron and ion scattering cross sections for modeling low temperature plasmas.

## Installation

To get familiar with the code read the following documentation:

- [docs/code-contributor.md](docs/code-contributor.md) for technology choices.
- [database/README.md](database/README.md) for spinning up the database and filling it.
- [app/README.md](app/README.md) for web application and web service
- [schema/README.md](schema/README.md) for JSON schemas and Typescript types of LXCat documents
- [converter/README.md](converter/README.md) for conversion to the legacy LXCat format.

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
cp -r <production data seed> ./packages/database/seeds/<production data seed>
docker-compose run setup load-css /packages/database/seeds/<production data seed>
# To give an already logged in user admin rights
docker-compose run setup make-admin <email of user>
```

Web application will run at `http://localhost:3000`.
The app should be reversed proxied by a web server to provide https.

## License

The code in this project is released under GNU Affero General Public License v3.0 or later.
Except for the schema (packages/schema) and converter (packages/converter) packages which is released under Apache 2.0.
