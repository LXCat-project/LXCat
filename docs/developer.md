# Developer docs

To consume LXCat data by another program, the LXCat web service provides several API endpoints.

## Table of contents

## Authorize and authenticate

The API endpoints of the LXcat web service require authorization and authentication.

You can get authorized by mailing [admin@lxcat.net](mailto:admin@lxcat.net?subject=LXCat%20developer%20request&body=Hi%20LXCat%20administrator%2C%0AI%20would%20like%20permission%20to%20use%20the%20API.).
Send the mail from the same email you used to login to LXCat.

Authentication is done using a [JWT](https://jwt.io) token. 
The token can be generated and copied from the [/developer](/developer) page.

Use `Authorization: Bearer <token>` as header in all of the HTTP requests.

## Fetch particle states

To retrieve states of particle `Ar` use:

```bash
export FILTER=$(echo '{"particle": {"Ar": { "charge": {}}}}' | base64)
curl https://nl.lxcat.net/api/states?filter=$FILTER
```
The filter value is JSON object which [base64 encoded](https://developer.mozilla.org/en-US/docs/Glossary/Base64), because it is nested and contains URL un-friendly characters. 

This will return something like

```json
{
  "433590": {
    "charge": 0,
    "id": "Ar",
    "particle": "Ar"
  },
  "433593": {
    "charge": 0,
    "electronic": [
      {
        "scheme": "LS",
        "config": [],
        "term": {
          "L": 0,
          "S": 0,
          "P": 1,
          "J": 0
        },
        "summary": "^1S_0"
      }
    ],
    "id": "Ar{^1S_0}",
    "particle": "Ar",
    "type": "AtomLS"
  }
}
```

The filter search param must be a subset of what you get back from

```bash
curl https://nl.lxcat.net/api/states/choices
```

## Fetch cross section sets

To fetch first page of cross section sets use

```bash
curl https://nl.lxcat.net/api/scat-css
```

```json
{
  "items: [
    {
      "id": "421901",
      "name": "Some name"
    },
    {
      "id": "421942",
      "name": "Some other name"
    }
  ]
}
```

### Filtering

The sets can be filtered on 3 facets: species, contributor, tag.

The cross section sets can be filtered on which species of particle occur in any of their cross sections by using the `species` search param. The `species` search param value uses the same format as the [state filter](#fetch-particle-states).

The `contributor` search param will filter on contributing organization. 
To retrieve all sets either contributed by `Some org` or `Other org` use:

```bash
curl https://nl.lxcat.net/api/scat-css?contributor=Some+org&contributor=Other+org
```

Cross section sets can be filtered on reaction type tag by using the `tag` search param.
For example to only get sets which have a cross section with a rotational reaction use

```bash
curl https://nl.lxcat.net/api/scat-css?tag=Rotational
```

Another way to get the filter you want is to go to [https://nl.lxcat.net//scat-css](https://nl.lxcat.net//scat-css), apply some filters and copy all the search params (stuff after `?` in the adress bar) to `https://nl.lxcat.net/api/scat-css?<search params from web page>`.

### Paging

The `offset` and `count` search param can be used for paging.

For example to list sets 1,2,3 use

```bash
curl https://nl.lxcat.net/api/scat-css?offset=1&count=3
```

## Fetch cross section set

To fetch a single cross section set use the id property found in [fetch cross section sets](#fetch-cross-section-sets) query.

To fetch in JSON format use

```bash
curl https://nl.lxcat.net/api/scat-css/<id of set>
```

The style of the reference can be changed using `refstyle` search param.
Valid choices are `csl` (default), `apa` and `bibtex`.

For example

```bash
curl https://nl.lxcat.net/api/scat-css/<id of set>?refstyle=apa
```

To fetch in Bolsig+ format use

```bash
curl https://nl.lxcat.net/api/scat-css/<id of set>/legacy
```

## Fetch a cross section

To fetch in JSON format use

```bash
curl https://nl.lxcat.net/api/scat-cs/<id of section>
```

## Fetch multiple cross sections

To fetch in JSON format use

```bash
curl https://nl.lxcat.net/api/scat-cs/bag?ids=<id of section1>,<id of section2>
```
