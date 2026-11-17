# Deployment and launch checklist

This project is a frontend application. Hosting the Vite `dist` directory makes the interface available, but does not provision databases, secure owner accounts, activate AI agents, connect payments, or guarantee income.

## 1. Review before publishing

- Inspect all dashboard modules and identify mock metrics, sample users, tokens, legal/ownership assertions, and claimed active domains. Replace them with verified data or label them clearly as demo content.
- Do not publish personal identifiers, personal contact details, private access tokens, or financial information. If any real credentials have ever been committed, revoke/rotate them and remove them from history as appropriate.
- Run `npm run lint` and `npm run build`; resolve all failures before deployment.

## 2. Deploy on Cloudflare Pages

1. Create a Cloudflare Pages project and connect the repository.
2. Choose the reviewed production branch.
3. Set build command to `npm run build`, output directory to `dist`, and Node.js to version 20 or newer.
4. Deploy. Verify the generated `*.pages.dev` URL, mobile layout, browser console, and all navigation paths.
5. Add a custom domain only if you own/control it, then follow Cloudflare's DNS and TLS checks. Free hosting does not mean a free registered custom domain.

## 3. Firebase setup and authorization

1. In Firebase Console, confirm the intended project, enable only the required authentication providers, and configure authorized domains.
2. Review and test `firestore.rules` in the Firebase Emulator or Rules Playground before deployment.
3. The rules trust a Firebase Auth custom claim named `role`; an owner claim must be granted by a trusted server/Admin SDK process after independently verifying the owner. Never assign a privileged role from frontend code or from a user-writable Firestore profile.
4. Apply the rules using the Firebase Console or an authorized Firebase CLI deployment. Confirm unauthenticated access is denied and each role has only the required access.
5. The current `/test` read now requires authentication. Make the UI's Firestore connectivity check run after sign-in or replace it with a non-public server-side health endpoint.

## 4. Secrets and AI/payment integrations

- Store server-side credentials in the hosting provider's secret manager or GitHub Actions secrets; do not commit them or expose them through `VITE_*` build variables.
- Firebase browser config is not an Admin credential, but restrict its API key by API and authorized domains and use Firebase Security Rules as the actual data boundary.
- Add AI, payment, messaging, and social-platform integrations only through documented server-side endpoints, least-privilege credentials, rate limits, audit logging, user consent, and provider/legal review.
- Test payment flows in sandbox mode. Do not enable financial transfers, trading, publishing, or other irreversible agent actions without explicit human approval and operational controls.

## 5. Verify the launch

- Confirm a successful build/deployment in the host's deployment history; a branch commit alone is not a live deployment.
- Check authentication, role boundaries, Firestore rules, accessibility, error handling, backups, privacy disclosures, and incident/recovery steps.
- Confirm the published URL and DNS/TLS status in the hosting provider. No domain, service activation, revenue, or production readiness should be claimed until independently verified.

## ChatGPT/Copilot repository access

Repository access for ChatGPT/Copilot is granted through the relevant account integration, OAuth/app installation, and repository selection settings. A repository commit cannot enable that access. Grant only the minimum required repository permissions and review the authorization in your GitHub settings.
