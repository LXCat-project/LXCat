# Code contributor docs

* Where is the code?
* How to perform local deployment with test data?
* How to make a merge request

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
