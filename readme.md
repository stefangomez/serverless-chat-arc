# Serverless Chat App Example

A simple full-stack chat app (web and mobile) with a serverless backend.

built with Architect(https://arc.codes)

## Local development

# Requirements

- `node` v14.x, `yarn`
- for mobile dev, see: https://docs.expo.dev/get-started/installation/

### Install dependencies for backend, web, and mobile

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

[![amplifybutton](https://oneclick.amplifyapp.com/button.svg)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/stefangomez/serverless-chat-arc)

- \*\* after initial deploy, you need to manually update the rewrites/redirects to match the configuration in `amplify-redirects.json`
- `main` branch will deploy a `production` env. All other branches will be a `staging-{branch-name}` deploy. see (https://arc.codes/docs/en/guides/developer-experience/deployment)
