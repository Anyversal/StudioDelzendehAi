# StudioDelzendehAi

A TypeScript/React/Vite dashboard starter with Persian and English UI and multiple AI-workflow presentation modules. Most dashboard metrics and workflows are currently demo/mock data; this repository does not by itself provide autonomous AI employees, payment processing, or guaranteed revenue.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Production build and local preview:

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

`npm run lint` runs the TypeScript compiler without emitting files.

## Free static hosting

### Cloudflare Pages (recommended for the current setup)

1. Sign in to Cloudflare and create a Pages project connected to this repository.
2. Select the production branch you intend to publish (merge `copilot/free-pages-deploy` only after review).
3. Set build command to `npm run build` and output directory to `dist`.
4. Use Node.js 20 or newer for the build environment.
5. Deploy and verify the generated `*.pages.dev` address. A custom domain requires a domain you own and DNS configuration; it is not included free by the hosting plan.

### GitHub Pages

Vite is configured to emit relative asset URLs in production, and `public/404.html` is included. However, the deployment workflow is not present in this branch. To publish on GitHub Pages, configure a GitHub Actions workflow with Pages write and OIDC permissions, then set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Do not assume deployment is active until an Actions run succeeds and the Pages environment shows a published URL.

## Security and production readiness

- Firestore rules in `firestore.rules` restrict access by default and use Firebase Authentication custom claims for privileged roles. Assign claims only from a trusted server using the Firebase Admin SDK; never trust a role selected in the browser or stored in a client-editable profile.
- Deploying these rules will block anonymous reads/writes to `/test`. The current app's Firestore connection check may need an authenticated user or a dedicated server-side health check.
- Review all dashboard components for mock/demo data and remove personal or fabricated ownership, financial, domain, and team claims before public launch.
- Firebase web configuration values are identifiers used by browser apps, not server secrets. Restrict the Firebase API key to the required APIs and authorized domains. Never put Gemini, payment-provider, signing, or Admin SDK secrets in `VITE_*` variables or client code.
- No payment provider, revenue stream, custom domain, production database, or AI-agent backend is provisioned merely by building or hosting this frontend.
- GitHub Copilot/ChatGPT repository access is managed through account/app authorization settings and cannot be granted by code in this repository.

See [DEPLOYMENT.md](DEPLOYMENT.md) for a launch checklist.
