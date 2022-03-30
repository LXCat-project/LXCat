# Code contributor docs

## Where is the code?

Code to fill the database can be found in [../database/](../database/).
Code to that runs the website can be found in [../app/](../app/).

## How to perform local deployment with test data?

See [../database/README](../database/README) how to seed the database with test data.

## How to make a merge request

See <https://docs.gitlab.com/ee/user/project/merge_requests/getting_started.html> how to create merge request in <https://gitlab.com/LXCat-project/lxcat-ng> repository.

## Technology choices

* Database = ArangoDB
* Programming language = TypeScript
* Web framework = NextJS
* UI framework = React
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
