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

The app can use [Orcid](https://orcid.org), [Auth0](https://auth0.com/) or [GitLab Appliction](https://gitlab.com/-/profile/applications) to perform authentication. User management is stored in the ArangoDB users collection.

### In auth0 dashboard

1. Create a new application of type `Regular Web Applications`.

    - Allowed Callback URLs
        - For dev deployment set to `http://localhost:3000/api/auth/callback/auth0`
    - Allowed Logout URLs
        - For dev deployment set to `http://localhost:3000`

2. Make sure `disable sign ups` is disabled in auth0 authentication database settings

### In GitLab application settings

1. Create a [new application](https://gitlab.com/-/profile/applications)

    - Redirect URI
        - For dev deployments set to `http://localhost:3000/api/auth/callback/gitlab`
    - Scopes
        - Select `openid`, `profile` and `email`

### For Orcid sandbox

1. Register on [https://sandbox.orcid.org/](https://sandbox.orcid.org/)

    - Only one app can be registered per orcid account, so use alias when primary account already has an registered app.
    - Use `<something>@mailinator.com` as email, because to register app you need a verified email and Orcid sandbox only sends mails to `mailinator.com`.

2. Goto [https://www.mailinator.com/v4/public/inboxes.jsp](https://www.mailinator.com/v4/public/inboxes.jsp) and search for `<something>` and verify your email adress
3. Goto [https://sandbox.orcid.org/developer-tools](https://sandbox.orcid.org/developer-tools) to register for public API.

    - Your website URL
        - Does not allow localhost URL, so use `https://lxcat.net`
    - Redirect URI
        - For dev deployments set to `http://localhost:3000/api/auth/callback/orcidsandbox`

### For Orcid

1. Register on [https://orcid.org/](https://orcid.org/)

    - Only one app can be registered per orcid account, so use alias when primary account already has an registered app.

2. Goto [https://orcid.org/developer-tools](https://orcid.org/developer-tools) to register for public API.

    - Your website URL
        - Does not allow localhost URL, so use `https://lxcat.net`
    - Redirect URI, requires https
        - For dev deployments the nextjs server on http://localhost:3000 has to be reversed-proxied to https
            This can be done with [caddyserver](https://caddyserver.com/)

            ```sh
            docker run --network host --rm caddy:2.4.6 caddy reverse-proxy --to http://localhost:3000
            ```

            And set redirect URL to `https://localhost/api/auth/callback/orcid`
            Also set `NEXTAUTH_URL=https://localhost/api/auth` in `.env.local` file.
        - For production deployments set to `https://< lxcat ng domain >/api/auth/callback/orcid`
            Also set `NEXTAUTH_URL=https://< lxcat ng domain >/api/auth` in `.env.local` file.

### In local directory

1. In `.env.local` defined following key/value pairs

    ```env
    NEXTAUTH_SECRET=<Random string to get rid of warning>
    # When you want to use Auth0 as identity provider set the AUTH0_* vars
    AUTH0_CLIENT_ID=<Client ID from Auth0 application settings page>
    AUTH0_CLIENT_SECRET=<Client secret from Auth0 application settings page>
    AUTH0_ISSUER=<Domain from Auth0 application settings page with `https://` prepended>
    # When you want to use GitLab as identity provider set the GITLAB_* vars
    GITLAB_CLIENT_ID=<Application ID from GitLab application page>
    GITLAB_CLIENT_SECRET=<Client secret from GitLab application page>
    # When you want to use Orcid as identity provider set the ORCID_* vars
    ORCID_CLIENT_ID=<Client ID from Orcid developer tools page>
    ORCID_CLIENT_SECRET=<Client secret from Orcid developer tools page>
    # To use Orcid sandbox instead of production Orcid set following var
    ORCID_SANDBOX=True
    ```

At least one identity provider should be configured.
