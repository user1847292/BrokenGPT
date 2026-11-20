# BrokenGPT backend (demo-preview)

Adds username-based accounts, server-side sessions, encrypted provider-key storage, and authenticated OpenAI/Gemini chat requests.

## Requirements
- Node.js 20+
- Persistent disk for the SQLite database
- HTTPS in production

## Run locally
1. Open a terminal in `backend/`.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Generate a key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
5. Put the 64-character result in `BROKENGPT_ENCRYPTION_KEY` in `.env`.
6. Run `npm start` and open `http://localhost:3000`.

Keep `.env` and `backend/data/` private. Back up the database securely. If the encryption key is lost, saved provider keys cannot be recovered. Never commit `.env` or database files.

## API
- `GET /api/health`
- `POST /api/auth/register` and `/api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout` (CSRF token required)
- `GET /api/providers`
- `PUT /api/providers/openai/key` or `/api/providers/gemini/key` (CSRF token required)
- `DELETE /api/providers/:provider/key` (CSRF token required)
- `POST /api/chat`

Passwords use Node scrypt. Sessions use HttpOnly, SameSite=Strict cookies. Provider keys are encrypted with AES-256-GCM. The browser must use same-origin requests and send `X-CSRF-Token` for state-changing requests.

## Limitations
This demo-preview backend is not deployed by the repository workflow. Online use requires a private HTTPS deployment with persistent storage and a private encryption key. Provider usage and costs are controlled by the provider account and model limits; BROKENGPT does not unlock paid models for free. Only OpenAI and Gemini are supported in this first backend stage.

Media generation is limited to five requests per hour per client IP in this starter. Image and video generation may cost money; some models or video features may require provider approval or organization verification. The app asks for confirmation before starting media jobs. Use an adult-managed provider account with the account owner's permission.

## Owner access and conversation moderation

Owner sign-in uses the normal username/password check followed by a six-digit email code. Codes expire after five minutes, are single-use, and allow at most five attempts. Email delivery uses the Resend API; no Gmail password is needed.

1. Create the owner account normally.
2. In the private SQLite database, retrieve that account's `users.id` using the unique owner username.
3. Set `BROKENGPT_OWNER_USER_ID` to that exact ID and `BROKENGPT_OWNER_EMAIL` to the owner's destination inbox in the hosting provider's private environment settings.
4. Configure `RESEND_API_KEY` and `BROKENGPT_EMAIL_FROM` with a verified sender in Resend.
5. Restart the service. The owner account will be required to enter the emailed code on every new login.

Never put these values in source control. The dashboard endpoints require both the configured owner user ID and a session marked as email-verified. Conversation transcript access is audit-logged. Online chat prompts and assistant replies are stored server-side for this disclosed moderation feature; tell users this before they create accounts or use chat. The owner dashboard is not a secret surveillance feature.


## CI checks

The repository workflow runs `npm run check` and starts the backend on a temporary CI port to verify `GET /api/health`. This is a smoke test only; it does not make external OpenAI/Gemini requests and does not replace an end-to-end test.

## Hosting checklist

- Deploy the `backend/` directory with Node.js 20 or newer.
- Set `NODE_ENV=production` and a strong private `BROKENGPT_ENCRYPTION_KEY` in the host's secret environment settings.
- Attach persistent private storage for `backend/data/`; the SQLite database must survive restarts and redeployments.
- Enable HTTPS and configure trusted proxy settings only when the host is actually behind its documented proxy.
- Configure owner dashboard variables only after verifying the owner account and email sender.
- Restrict demo access before sharing a public URL. The current account registration endpoint is open by default; do not assume a login screen makes the service private.
