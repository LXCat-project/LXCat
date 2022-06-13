# Code contributor docs

## Table of contents

## Where is the code?

Code to fill the database can be found in [../database/](../database/).
Code to that runs the website can be found in [../app/](../app/).
Code to that describes the shape of LXCat documents can be found in [../schema/](../schema/).

## How to perform local deployment with test data?

See [../database/README](../database/README) how to seed the database with test data.

## How to make a merge request

See [https://docs.gitlab.com/ee/user/project/merge_requests/getting_started.html](https://docs.gitlab.com/ee/user/project/merge_requests/getting_started.html) how to create merge request in [repository](https://gitlab.com/LXCat-project/lxcat-ng).

## Documentation

The documentation is formatted in Markdown files in the `/docs` directory.

The documentation is also hosted on the website at `https://<somewhere>/docs`.

To have working links between Markdown files on the website use URLs without the `.md` extension.

The following features are available in Markdown

### Inject Table of contents

Adding `## Table of contents` will inject a table of contents for all headers.
All the headers also become bookmarkable.

### Code highlighting

Code block will be highlighted.
For example

````markdown
```ts
function add(a: string, b: string): string {
  return a + b
}
```
````

is highlighted as

```ts
function add(a: string, b: string): string {
  return a + b
}
```

### Local images

For example show the `./screenshot.png` image inside Markdown file use `![](screenshot.png)`. The path of the image should be relative to the Markdown file..

### Diagrams

You can add code blocks using [mermaidjs](https://mermaid-js.github.io/mermaid/#/) format to render diagrams.

For example

````markdown
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
````

is rendered as

```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

### Math

LaTeX equations can be added by wrapping the equation with `$$`.

For example

```markdown
$$
L = \frac{1}{2} \rho v^2 S C_L
$$
```

is rendered as

$$
L = \frac{1}{2} \rho v^2 S C_L
$$

## Technology wishes

Document to figure out what pieces of software to use.

Stack should be stable and usable by maintainers of lxcat.

The current lxcat is written in PHP and uses Mysql as database with phpmyadmin as admin interface.
In the new lxcat, the admin interface should be part of the web application and offer some one to upload or edit a cross section set using a web form. This new interface should be behind a login.

The prototype by Daan is written in [Typescript](https://www.typescriptlang.org/) and uses [Arangodb](https://www.arangodb.com) as database.
For the new lxcat we want to keep using TypeScript and ArangoDB.

The current lxcat uses a [time machine](https://nl.lxcat.net/data/time_machine.php) to show previous versions of data.
The current lxcat can show the whole lxcat website as it was at a date in the past.
This time machine is mainly there to have a reference in a paper to a certain version of data.
The new lxcat must also allow for showing previous versions of data for proper referencing aswell.
Instead of a time machine implementation, we want to have multiple versions for each cross section or each cross.
Similar to [Zenodo](https://help.zenodo.org/#versioning) or [Uniprot](https://www.uniprot.org/uniprot/Q9Y5N1?version=*)

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
* Schema should be rich
  * title and description
  * min/max/length/etc. validation rules

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

## Debugging

In Visual Studio Code you can debug the server, client or fullstack by using the `/.vscode/launcher.json` file.
See [NextJS debugging docs](https://nextjs.org/docs/advanced-features/debugging#debugging-with-vs-code) and [VS Code docs](https://code.visualstudio.com/docs/nodejs/nodejs-debugging) for more info.

## Database diagram

The following diagram shows all document and edge collections.

> The columns mentioned are for illustration.
> Each document collection has a JSON schema (defined in /app/src/**/schema.ts) which defines the shape of each document inserted/updated.

```mermaid
erDiagram
    User {
        string email
    }
    Organization {
        string name
    }
    CrossSectionSet {
        string name
        string isComplete "Self consistent set which can be used in calculations"
        string organization FK
        string status "draft | published | archived | retracted"
        string version
        string commitMessage
    }
    CrossSection {
        string reaction FK
        string data
        string organization FK
        string status "draft | published | archived | retracted"
        string version
        string commitMessage
    }
    User ||--o{ MemberOf: from
    MemberOf |o--|{ Organization: to
    Organization ||--o{ CrossSectionSet: Provides
    CrossSectionSet ||--|{ CrossSectionSetHistory: fromFuture
    CrossSectionSet ||--|{ CrossSectionSetHistory: toPast
    CrossSection ||--|{ IsPartOf: from
    IsPartOf }|--|| CrossSectionSet: to
    Organization ||--o{ CrossSection: Provides
    CrossSection ||--|{ CrossSectionHistory: fromFuture
    CrossSection ||--|{ CrossSectionHistory: toPast
    Reference ||--|{ References: to
    References }|--|| CrossSection: from
    Reaction ||--|{ Produces: from
    Produces }|--|| State: to
    Reaction ||--|{ Consumes: from
    Consumes }|--|| State: to
    State |o--|{ HasDirectSubstate: from
    HasDirectSubstate ||--|{ State: to
    Reaction }|--|| CrossSection: reaction
```

The diagram can be edited on https://mermaid.live/ by copying the code block text.
