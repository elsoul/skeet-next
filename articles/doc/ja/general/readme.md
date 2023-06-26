---
id: readme
title: Readme
description: Media SSG Template README
---

![Skeet Framework Logo](https://storage.googleapis.com/skeet-assets/imgs/logo/ogp.png)

# Media SSG Template

## Aiming to

- Fast Development
- High Performance
- Global Scale
- Maintainable Code
- Strong SEO

## Summary

- [x] [Next.js - SSG Framework](https://nextjs.org/)
- [x] [React - UI Framework](https://reactjs.org/)
- [x] [TypeScript - Type Check](https://www.typescriptlang.org/)
- [x] [ESLint - Linter](https://eslint.org/)
- [x] [Prettier - Formatter](https://prettier.io/)
- [x] [Recoil - State Management](https://recoiljs.org/)
- [x] [Next i18next - i18n Translation](https://github.com/isaachinman/next-i18next)
- [x] [Firebase - Hosting & Analytics](https://firebase.google.com/)
- [x] [Tailwind - CSS Framework](https://tailwindcss.com/)

## Quick start

```bash
# Node version (using nodenv)
$ node -v
v18.16.0

# Install dependencies
$ yarn install --frozen-lockfile

# Run dev server (localhost:4200)
$ yarn dev
```

## Firebase Hosting

You need to login to Firebase to use Firebase Hosting to publish your media website.

```bash
# Install Firebase tools
$ npm i -g firebase-tools

# Login to Firebase to enable `yarn deploy` from local
$ firebase login

# Get FIREBASE_DEPLOY_TOKEN to use CI/CD
$ firebase login:ci

```

## GitHub Actions (CI/CD)

Needs to set Secrets on GitHub to work with GitHub Actions.

```
BING_API_KEY
FIREBASE_DEPLOY_TOKEN
```

Also you need the BING_API_KEY for .env to send sitemap when `yarn deploy`
