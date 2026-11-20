# BrokenGPT

BrokenGPT is a dark, blood-red AI workspace with a browser interface and a Node.js backend starter.

## Current project status

- The interface includes the Command Center, chat, Study Mode, modes, notes, Prompt Lab, learning cards, app connector prototype, Character Universe, RGB effects, and Ad Shield settings.
- The backend starter provides username-based accounts, secure sessions, encrypted OpenAI/Gemini API-key storage, authenticated chat, grade-aware Study Mode with image input, GPT Image generation, and Sora video-job endpoints.
- Chat voice controls use optional browser/device speech recognition and text-to-speech. Availability depends on the browser and device.
- AI Battle sends the same prompt to two models, shows both answers, and requests a combined response.
- 3D model generation, game export workflows, native Android companion features, and several external integrations remain in progress.

## Run locally

Follow [`backend/README.md`](backend/README.md). The backend serves the web interface from the same origin so secure session cookies work correctly.

## Important

This project is not yet fully built, deployed, or production-tested. The backend needs HTTPS, persistent storage, and a private `BROKENGPT_ENCRYPTION_KEY`. Provider usage may cost money and is controlled by the provider account and its limits. Media generation may require provider access or organization verification. Never commit `.env` files, API keys, or database files.


## Recent interface update
The chat composer now includes a plus menu for creative actions, a separate microphone button, and a send arrow. Plain-text file attachment is supported in the composer (8 KB maximum). Creative shortcuts open the existing image/video tools; 3D and game shortcuts are clearly marked as planned rather than functional generators. Iraqi Arabic has been added; Malay was already included.

OAuth sign-in, a server-managed guest AI service, 3D generation, and game export still require additional backend/provider configuration and testing. The app does not promise unlimited model or media usage.
\n## Study Mode\n\nStudy Mode supports primary-school grades, middle school, high school, university/college, and postgraduate levels. Learners can ask for explanations, homework guidance, quizzes, practice questions, study plans, or note review. It can send pictures to vision-capable OpenAI/Gemini models. A lesson video is represented by up to four sampled frames; video audio is not analysed. There is no lifetime message counter in the app design, but provider quotas, rate limits, model availability, upload limits, and costs still apply.\n