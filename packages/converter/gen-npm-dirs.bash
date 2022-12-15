#!/bin/bash

# script to generate skeleton platform dependent npm package, expects
# the platform string identifier used by napi-rs/node as argument

declare PLATFORM=$1
declare os=${PLATFORM%%-*}
declare ARCH
arch=${PLATFORM#*-}
arch=${arch%-*}

declare bindir=npm/${PLATFORM}
mkdir -p $bindir

cat > $bindir/package.json <<EOF
{
  "name": "@lxcat/converter-${PLATFORM}",
  "version": $(jq .version package.json),
  "description": "Convert LXCat JSON documents to legacy LXCat documents",
  "os": ["${OS}"],
  "cpu": ["${ARCH}"],
  "libc": ["<FIXME>"],
  "main": "converter.${PLATFORM}.node",
  "files": [
    "converter.${PLATFORM}.node"
  ],
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "access": "public"
  },
  "author": "Daan Boer",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://gitlab.com/LXCat-project/lxcat.git"
  },
  "bugs": {
    "url": "https://gitlab.com/LXCat-project/lxcat/-/issues"
  },
  "homepage": "https://gitlab.com/LXCat-project/lxcat/-/tree/main/packages/converter"
}
EOF

cat > $bindir/README.md <<EOF
This is the ${PLATFORM} binary package for the parent \`@lxcat/converter\`.
EOF
