<!--
SPDX-FileCopyrightText: LXCat team

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Developer docs

To consume LXCat data by another program, the LXCat web service provides a REST API.
The API is meant for programs, the website itself does not use it. The complete
description of all endpoints, including the response formats, is available as an
[OpenAPI](https://www.openapis.org) document at `/api/doc`, rendered at
[/api-doc](/api-doc).

- [Developer docs](#developer-docs)
  - [Authorize and authenticate](#authorize-and-authenticate)
  - [Overview of the endpoints](#overview-of-the-endpoints)
  - [Find cross section sets](#find-cross-section-sets)
  - [Fetch a cross section set](#fetch-a-cross-section-set)
  - [Fetch cross sections](#fetch-cross-sections)
  - [Fetch references](#fetch-references)
  - [JSON schemas](#json-schemas)
  - [Upload and manage cross section sets](#upload-and-manage-cross-section-sets)

The examples use `curl` and the `LXCAT_URL` and `LXCAT_TOKEN` environment variables:

```bash
export LXCAT_URL=https://nl.lxcat.net # The address of the LXCat instance you use.
export LXCAT_TOKEN=<token>            # See the next section.
```

## Authorize and authenticate

All endpoints that retrieve or modify data require an API token. The schema endpoints
and the OpenAPI description are public.

1. Get authorized by mailing
   [info@lxcat.net](mailto:info@lxcat.net?subject=LXCat%20developer%20request&body=Hi%20LXCat%20administrator%2C%0AI%20would%20like%20permission%20to%20use%20the%20API.).
   Send the mail from the same email you used to login to LXCat. An administrator will
   give you the **developer** role.
2. Log in, go to the [/developer](/developer) page, agree with the terms of use and
   generate a token. The token is valid for a year, after which you generate a new one.
   You can give a token a name, and the page lists your tokens, where you can revoke the
   ones you no longer use or that leaked.
3. Send the token as `Authorization: Bearer <token>` header in every request:

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" $LXCAT_URL/api/set
```

Keep the token secret, it gives access to the API in your name. A token is tied to your
account, and your roles are looked up in the database on every request. When your roles
change, or your account is removed, existing tokens are affected immediately. Logging in
to the website does not give access to the API, only a token does. A token only works
while you have the developer role. Tokens from before the tokens were tied to the
account no longer work, generate a new one.

A request is answered with:

- `401 Unauthorized` when the `Authorization` header is missing, contains an invalid or
  expired token, or when the token or its user no longer exists.
- `403 Forbidden` when the user does not have the role that the endpoint needs.

The data endpoints can be called from a web page on a few origins, for example
`https://loki-suite.github.io`. The author endpoints are meant for programs and do not
allow this. Other programs are not restricted.

The data is subject to the terms of use, which are shown on the [/developer](/developer)
page. The documents with cross section data contain a `termsOfUse` field with a link to
them. Please make sure to cite the data you use.

## Overview of the endpoints

| Endpoint                                           | Role      | Description                                         |
| -------------------------------------------------- | --------- | --------------------------------------------------- |
| `GET /api/set`                                     | developer | List the published cross section sets               |
| `GET /api/set/{id}`                                | developer | A cross section set in JSON format                  |
| `GET /api/set/{id}/legacy`                         | developer | A cross section set in the legacy text format       |
| `GET /api/data/{id}`                               | developer | A single cross section                              |
| `GET /api/data/inspect?ids=`                       | developer | A selection of cross sections in JSON format        |
| `GET /api/data/inspect/legacy?ids=`                | developer | A selection of cross sections in legacy text format |
| `GET /api/references/{format}/for-selection/{ids}` | developer | The references of a selection of cross sections     |
| `GET /api/references/{format}/{ids}`               | developer | References by their identifiers                     |
| `GET /api/set/LTPDocument`, `LTPMixture`           | public    | JSON schemas of sets and selections                 |
| `GET /api/set/schema/upload-document`              | public    | JSON schema of a document that can be uploaded      |
| `GET, POST /api/author/set`                        | author    | List owned sets, upload a new set                   |
| `POST, DELETE /api/author/set/{id}`                | author    | Edit, delete a draft; retract needs publisher too   |
| `POST /api/author/set/{id}/publish`                | publisher | Publish an owned draft set                          |

## Find cross section sets

To list all published cross section sets use

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" $LXCAT_URL/api/set
```

```json
[
  {
    "id": "421901",
    "name": "Some name"
  },
  {
    "id": "421942",
    "name": "Some other name"
  }
]
```

The sets can be filtered on the organization that contributed them with the `contributor`
search param:

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" "$LXCAT_URL/api/set?contributor=Some+org"
```

## Fetch a cross section set

To fetch a single cross section set in JSON format use the `id` found in the list of
sets:

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" "$LXCAT_URL/api/set/<id of set>"
```

The result is a document that follows the [schema](#json-schemas) found in its `$schema`
field. The cross sections of the set are listed in `processes`, and the `_key` of each
cross section (`processes[].info[]._key`) can be used to
[fetch cross sections](#fetch-cross-sections) and
[references](#fetch-references).

The style of the references can be changed with the `refstyle` search param. Valid
choices are `csl` (default), `apa` and `bibtex`.

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" "$LXCAT_URL/api/set/<id of set>?refstyle=bibtex"
```

To fetch the set in the legacy text format, that is for example used by BOLSIG+, use

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" "$LXCAT_URL/api/set/<id of set>/legacy"
```

## Fetch cross sections

To fetch a single cross section use

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" "$LXCAT_URL/api/data/<id of cross section>"
```

To fetch a selection of cross sections as one document use the `ids` search param with
a comma separated list of at most 100 unique ids:

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" "$LXCAT_URL/api/data/inspect?ids=<id of cross section 1>,<id of cross section 2>"
```

The result follows the schema of a mixture, see [JSON schemas](#json-schemas). Use
`/api/data/inspect/legacy` instead to get the selection in the legacy text format.

## Fetch references

The references of a selection of cross sections can be fetched as `csl-json`, `bibtex` or
`ris`. The ids are those of the cross sections, separated by a slash. The result starts
with a reference to the selection itself.

```bash
curl -H "Authorization: Bearer $LXCAT_TOKEN" \
  "$LXCAT_URL/api/references/bibtex/for-selection/<id of cross section 1>/<id of cross section 2>"
```

`/api/references/<format>/<id of reference>/...` returns references by their own
identifiers, this is only useful when you already know these.

## JSON schemas

The documents that the API returns and accepts are described by JSON schemas. These
endpoints do not need a token:

- `/api/set/LTPDocument`, a cross section set as returned by
  `/api/set/<id of set>`.
- `/api/set/LTPMixture`, a selection of cross sections as returned by
  `/api/data/inspect`.
- `/api/set/schema/upload-document`, a document that can be uploaded as a new
  cross section set.

## Upload and manage cross section sets

Members of an organization with the **author** role can also manage the cross section
sets of their organization through the API. This uses the same flow of operations as
the [website](2-data-contributor), so a set is added as a draft first. To generate a
token you need the developer role, as described [above](#authorize-and-authenticate).

To upload a new set, send a document that follows the upload schema together with a
message. The contributor of the document should be an organization you are a member of.

```bash
jq -n --slurpfile doc set.json --arg message "Initial upload." \
  '{doc: $doc[0], message: $message}' \
  | curl -X POST -H "Authorization: Bearer $LXCAT_TOKEN" \
    -H "Content-Type: application/json" --data @- \
    $LXCAT_URL/api/author/set
```

The response is the `id` of the new draft set, for example `{"id": "421901"}`. Problems
with the document result in a `400 Bad Request` with a description of the problems.

The other operations, with the id of an owned set:

- `GET /api/author/set` lists the sets you own, including drafts.
- `POST /api/author/set/<id of set>` with the same body as above stores the edited
  set as a draft. The response contains the id of the draft. The contributor of an
  existing set cannot be changed.
- `POST /api/author/set/<id of set>/publish` publishes a draft, this needs the
  **publisher** role.
- `DELETE /api/author/set/<id of set>` with a body `{"message": "..."}` removes a
  draft, or retracts a published set when you also have the **publisher** role. The
  message is always required.
