# StudioDelzendehAi

A production-oriented TypeScript dashboard and enterprise AI platform starter that can be hosted on free static hosting platforms such as GitHub Pages and Cloudflare Pages.

## Overview

This project includes a multi-module dashboard with enterprise-style modules, AI workflow visuals, and a presentation layer for a global AI automation brand.

## Quick start

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

## Free deployment options

### GitHub Pages

1. Push this repository to GitHub.
2. Open repository Settings → Pages.
3. Set Source to GitHub Actions.
4. The workflow in `.github/workflows/deploy-pages.yml` will publish the site automatically.
5. After the workflow completes, your site will be available at:
   `https://<username>.github.io/<repository>`

### Cloudflare Pages

1. Import the repository into Cloudflare Pages.
2. Use the following build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Deploy the project.

## Important notes

- The project uses Vite with `base: './'` in production mode for static hosting compatibility.
- `public/404.html` is included for client-side fallback handling.
- Any real API keys, Firebase secrets, and production data must be stored in environment variables or GitHub repository secrets. Do not commit live secrets.
- Access to GitHub Copilot / ChatGPT repository features is managed by GitHub account and organization settings, not by the repository contents themselves.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Project status

This repository is prepared for a free static-hosting path and can be used as a clean starting point for further product and business deployment work.
