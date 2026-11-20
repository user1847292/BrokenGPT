# BrokenGPT

BrokenGPT is a dark, blood-red AI workspace for chatting, learning, creating, and practicing defensive cybersecurity.

## Demo-preview status

This branch is a **work in progress**, not a finished or production-approved release.

### Implemented in the current starter
- Browser workspace with chat, modes, settings, notes, Prompt Lab, learning tools, character tools, and local preferences.
- Node.js backend with username/password accounts, server-side sessions, CSRF protection, rate limits, and encrypted provider-key storage.
- OpenAI and Google Gemini chat endpoints.
- AI Battle workflow using two provider responses and a synthesis request.
- Image and video generation endpoints, subject to provider access, model availability, and charges.
- Optional device speech input/output, depending on browser support.
- Owner moderation dashboard scaffolding with email verification and audit logging.

### Still incomplete or requiring verification
- No hosted private demo is deployed by this repository change.
- Real provider calls, account flows, AI Battle, and media generation still need end-to-end testing with valid provider accounts.
- 3D model generation, complete game export, native Android features, and some integrations are not implemented.
- This is a responsive web app/PWA starter, not a signed native Android release.

## Run locally

See [backend/README.md](backend/README.md). The backend serves the browser interface from the same origin.

## Hosting setup

A Render Blueprint is included in `render.yaml`. It configures the backend, HTTPS health check, a persistent 1 GB disk, a generated encryption key, and a required private demo password. The configured `starter` web-service plan and persistent disk are paid resources; an adult should review the account, costs, and deployment before creating the service. The Blueprint does not deploy anything automatically (`autoDeploy: false`).

## Automated checks

The `.github/workflows/demo-preview-checks.yml` workflow checks JavaScript syntax, installs backend dependencies, starts the backend, and checks `GET /api/health` on pushes and pull requests targeting `demo-preview`.

These checks verify basic code parsing and server startup only. They do **not** verify real AI provider access, security certification, Google Play approval, or production readiness.

## Privacy and security notes

- Online chat prompts and assistant replies are stored server-side for the disclosed conversation-review/moderation feature. Users must be told this before using the hosted service.
- Provider API keys are stored server-side encrypted with AES-256-GCM. Keep the encryption key private and persistent.
- Use HTTPS and persistent private storage in any hosted environment.
- Before sharing a demo URL, set `BROKENGPT_DEMO_ACCESS_PASSWORD` in the host's private environment settings. The app then requires HTTP Basic Auth (username `demo`) for all pages and API routes except the health check. Do not rely on an obscure URL for privacy.
- Never commit `.env`, API keys, owner email addresses, database files, passwords, or other secrets.
- Cybersecurity features are intended for authorized defensive learning and testing only.
- Media requests can incur provider charges. Usage limits and access are controlled by the provider, not BrokenGPT.

Do not publish this branch as a stable release until end-to-end testing, privacy disclosures, deployment configuration, and security review are complete.
