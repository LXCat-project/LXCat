This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy with Docker

Builder the Docker image with

```shell
docker build -t lxcat/app .
```

Run with

```shell
docker run -p 3000:3000 lxcat/app
```

## Setup auth

The app can use [Auth0](https://auth0.com/) to perform user management and authentication.

In auth0 dashboard

1. Create a new application of type `Regular Web Applications`.
2. Create roles

    - root, can do anything
    - contributor, can add and edit own records
    - developer, can get token to interact with API

3. Make sure `disable sign ups` is disabled in auth0 authentication database settings

In local directory

1. In `.env.local` defined following key/value pairs

    ```env
    AUTH0_CLIENT_ID=<Client ID from Auth0 application settings page>
    AUTH0_CLIENT_SECRET=<Client secret from Auth0 application settings page>
    AUTH0_ISSUER=<Domain from Auth0 application settings page with `https://` prepended>
    NEXTAUTH_SECRET=<Random string to get rid of warning>
    ```
