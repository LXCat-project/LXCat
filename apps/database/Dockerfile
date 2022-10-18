FROM node:16-alpine

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git
WORKDIR /code
COPY . .
RUN npm install
# Build database and skip app workspace build
RUN npm run build --no-cache -w packages/schema -w apps/database

WORKDIR /code/database

ENTRYPOINT ["npm", "run"]
