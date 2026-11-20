# BrokenGPT backend (starter)

Adds username-based accounts, server-side sessions, encrypted provider-key storage, and authenticated chat requests for 12 provider integrations.

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
- `PUT /api/providers/:provider/key` for a supported provider (CSRF token required)
- `DELETE /api/providers/:provider/key` (CSRF token required)
- `POST /api/chat`

Passwords use Node scrypt. Sessions use HttpOnly, SameSite=Strict cookies. Provider keys are encrypted with AES-256-GCM. The browser must use same-origin requests and send `X-CSRF-Token` for state-changing requests.

## Limitations
This starter is not deployed. Online use requires a private HTTPS deployment with persistent storage and a private encryption key. Provider usage, age requirements, model availability, and costs are controlled by each provider account; BrokenGPT does not unlock paid models for free. Use an adult-managed account with the account owner's permission where required. Model IDs in the UI are examples and may change. Chat supports OpenAI, Google Gemini, Anthropic Claude, xAI, DeepSeek, Mistral, OpenRouter, Groq, Qwen (DashScope), Perplexity, Together AI, and Fireworks AI. Several integrations use OpenAI-compatible chat APIs. Study Mode image input remains limited to OpenAI and Gemini.

Media generation is limited to five requests per hour per client IP in this starter. Image and video generation may cost money; some models or video features may require provider approval or organization verification. The app asks for confirmation before starting media jobs. Use an adult-managed provider account with the account owner's permission.
