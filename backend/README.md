# BROKENGPT backend (starter)

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
This starter is not deployed. Online use requires a private HTTPS deployment with persistent storage and a private encryption key. Provider usage and costs are controlled by the provider account and model limits; BROKENGPT does not unlock paid models for free. Only OpenAI and Gemini are supported in this first backend stage.

Media generation is limited to five requests per hour per client IP in this starter. Image and video generation may cost money; some models or video features may require provider approval or organization verification. The app asks for confirmation before starting media jobs. Use an adult-managed provider account with the account owner's permission.


## Android Termux
From the repository root, run `bash scripts/termux-run.sh`. The script checks Node.js, installs backend dependencies, creates a private local `.env` key if missing, and starts the server. This runs the app locally but does not bundle an offline language model.
