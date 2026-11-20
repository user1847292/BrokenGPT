# BROKENGPT

BROKENGPT is a dark, blood-red AI workspace with a browser-based interface and a Node.js backend starter.

## Current project status

- The web interface includes the Command Center, chat workspace, modes, notes, Prompt Lab, learning cards, app connector prototype, Character Universe, RGB effects, and Ad Shield settings.
- The backend starter provides username-based accounts, secure sessions, encrypted OpenAI/Gemini API-key storage, and authenticated AI chat endpoints.
- Real AI use requires the backend to be deployed with HTTPS, persistent storage, and a private `BROKENGPT_ENCRYPTION_KEY`.

## Run locally

Follow [`backend/README.md`](backend/README.md). The backend serves the web interface from the same origin so session cookies work correctly.

## Important

This project is not yet fully built, deployed, or production-tested. Provider API usage may cost money and is controlled by each provider's own account and limits. Never commit `.env` files, provider keys, or database files.
