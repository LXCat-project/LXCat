# Code contributor docs

## Where is the code?

Code to fill the database can be found in [../database/](../database/).
Code to that runs the website can be found in [../app/](../app/).

## How to perform local deployment with test data?

See [../database/README](../database/README) how to seed the database with test data.

## How to make a merge request

See <https://docs.gitlab.com/ee/user/project/merge_requests/getting_started.html> how to create merge request in <https://gitlab.com/LXCat-project/lxcat-ng> repository.

## Documentation

The documentation is formatted in Markdown files in the `/docs` directory.

The documentation is also hosted on the website at `https://<somewhere>/docs`.

To have working links between Markdown files on the website use URLs without the `.md` extension.

## Technology wishes

Document to figure out what pieces of software to use.

Stack should be stable and usable by maintainers of lxcat.

The current lxcat is written in PHP and uses Mysql as database with phpmyadmin as admin interface.

Prototype by Daan is written in Typescript and uses Arangodb as database.

For the new lxcat we want to keep using TypeScript and ArangoDB.

### Full stack web framework

Whishes:

* renders most HTML on server
* reuse layout
* styled using ui framework like material or antd
* auth
* api with openapi
* markdown
* db agnostic

### Schema / validation

* Autocomplete for developer IDE -> Typescript
* Validate at boundaries like incoming request
* Validate during [inserting/updating into database](https://www.arangodb.com/docs/3.9/data-modeling-documents-schema-validation.html) with JSON schema
* Support complex schemas like cross section document
* Cross language: Should be able to generate or use JSON schemas

Possible options see https://learning-notes.mistermicheels.com/javascript/typescript/runtime-type-checking

## Technology choices

* Database = ArangoDB
* Programming language = TypeScript
* Web framework = NextJS
* UI framework = React
* UI style framework = non yet
* API framework = API pages in NextJS
* App authentication = OpenID identity providers + [next-auth](https://next-auth.js.org)
* API authentication = (OpenID identity providers + next-auth) or JWT based API token
* Authorization = roles assigned to users
* OpenID identity provider = Orcid
* Schema = [Zod](https://github.com/colinhacks/zod), used for validation, typescript type, JSON schema for API consumers and database collection
* Database seeding and migration = Handrolled directory importer
* Configuration = dotenv
* Production deployment = docker-compose
* Development deployment = Database in Docker container and app on bare-metal
