FROM node:16-alpine

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /database
COPY database/package.json database/package-lock.json ./
RUN npm install

COPY database/src src
COPY database/setup setup

RUN mkdir -p /app/src
RUN ln -s /database/node_modules /app/node_modules
COPY app/src /app/src
COPY app/tsconfig.json /app/

ENTRYPOINT ["npm", "run"]
