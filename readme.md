# Serverless Chat App Example

A simple full-stack chat web app (mobile example in progress) with a serverless backend.

See live demo here: https://serverless-chat-arc.nafets.dev/

built with Architect(https://arc.codes)

## Local development

# Requirements

- `node` v14.x, `yarn`

### Install dependencies for backend, and web

```bash
npm run install:all
```

### Start backend & webapp

```bash
npm run dev
```

## Deploying to webapp & backend to AWS

### From local machine

```
npm run deploy:staging
```

```
npm run deploy:production
```

### Using Amplify Console
- Fork this repo
- Follow guide to connect your repo to amplify for automatic deployments: https://docs.aws.amazon.com/amplify/latest/userguide/getting-started.html
- \*\* after initial deploy, you need to manually update the rewrites/redirects to match the configuration in `amplify-redirects.json`
- `main` branch will deploy a `production` env. All other branches will be a `staging-{branch-name}` deploy. see (https://arc.codes/docs/en/guides/developer-experience/deployment)
