<!--
SPDX-FileCopyrightText: LXCat team

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# LXCat

An open-access website for collecting, displaying, and downloading electron and ion scattering cross sections for modeling low temperature plasmas.

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.8095107.svg)](https://doi.org/10.5281/zenodo.8095107)
[![Test Pipeline Status](https://github.com/LXCat-project/LXCat/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/LXCat-project/LXCat/actions/workflows/test.yml)

## Installation

To get familiar with the code read the following documentation:

- [docs/code-contributor.md](docs/code-contributor.md) for technology choices.
- [app/README.md](app/README.md) for web application and web service.
- [packages/database/README.md](packages/database/README.md) for spinning up the database and filling it.
- [packages/schema/README.md](packages/schema/README.md) for JSON schemas, validators and Typescript types of LXCat documents.
- [packages/converter/README.md](packages/converter/README.md) for conversion to the legacy LXCat format.

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

## How to cite

If you use LXCat in your project or in a scientific publication, we would
appreciate if you cite our project.

```bibtex
@software{LXCatLatest,
  author       = {Boer, Daan and
                  Verhoeven, Stefan and
                  Ali, Suvayu and
                  Graef, Wouter and
                  van Dijk, Jan},  
  title        = {LXCat},
  month        = jun,
  year         = 2023,
  publisher    = {Zenodo},
  version      = {latest},
  doi          = {10.5281/zenodo.8095107},
  url          = {https://doi.org/10.5281/zenodo.8095107}
}
```

## License

The code in this project is released under GNU Affero General Public License v3.0 or later.
Except for the schema (packages/schema) and converter (packages/converter) packages which are released under Apache 2.0.

## Copyright

The LXCat team wrote the LXCat code. The LXCat team members are listend in [CITATION.cff](CITATION.cff).
