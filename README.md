# BROKENGPT

BROKENGPT is a dark, blood-red AI workspace with a browser interface and a Node.js backend starter.

## Current project status

- The interface includes the Command Center, chat, modes, notes, Prompt Lab, learning cards, app connector prototype, Character Universe, RGB effects, and Ad Shield settings.
- The backend starter provides username-based accounts, secure sessions, encrypted OpenAI/Gemini API-key storage, authenticated chat, GPT Image generation, and Sora video-job endpoints.
- Chat voice controls use optional browser/device speech recognition and text-to-speech. Availability depends on the browser and device.
- AI Battle sends the same prompt to two models, shows both answers, and requests a combined response.
- 3D model generation, game export workflows, native Android companion features, and several external integrations remain in progress.

## Run locally

Follow [`backend/README.md`](backend/README.md). The backend serves the web interface from the same origin so secure session cookies work correctly.

## Important

This project is not yet fully built, deployed, or production-tested. The backend needs HTTPS, persistent storage, and a private `BROKENGPT_ENCRYPTION_KEY`. Provider usage may cost money and is controlled by the provider account and its limits. Media generation may require provider access or organization verification. Never commit `.env` files, API keys, or database files.
