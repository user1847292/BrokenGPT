# BrokenGPT implementation checklist

This file tracks the current repository state. “Implemented in code” does not mean live, deployed, or fully tested.

## Stage 1 — backend, accounts, providers
- [x] Node.js/Express backend starter
- [x] Username/password registration and sign-in
- [x] Password hashing with scrypt
- [x] HttpOnly session cookies and CSRF checks
- [x] Encrypted OpenAI/Gemini API-key storage
- [x] OpenAI and Gemini text chat routes
- [ ] Deploy backend with HTTPS and persistent storage
- [ ] Run dependency installation and backend runtime tests
- [ ] Add password reset, account deletion, and production account-recovery safeguards

## Stage 2 — chat and AI Battle
- [x] Chat UI sends requests to the backend
- [x] Personality and mode instructions passed with chat
- [x] Two independent model answers
- [x] Combined synthesis and per-model result panels
- [ ] Live provider testing with authorized provider accounts
- [ ] Add more providers and model discovery

## Stage 3 — voice and Creative Studio
- [x] Optional browser speech-to-text
- [x] Optional device text-to-speech
- [x] OpenAI GPT Image generation endpoint and UI
- [x] Sora video job creation, status, and download endpoints/UI
- [ ] Realtime natural voice conversation
- [ ] Original expressive character voices and contextual sound effects
- [ ] 3D model generation and export
- [ ] Game creation and export workflow
- [ ] Runtime testing with approved provider access

## Stage 4 — Character Universe and Android companion
- [x] Searchable 36-profile Character Universe prototype
- [x] Character selection, basic dialogue presets, and local persistence
- [ ] More character profiles and custom character builder improvements
- [ ] Licensed/original artwork, animations, and voice assets
- [ ] Native Android floating companion service and overlay permission flow
- [ ] Test Android lifecycle, battery use, and accessibility

## Stage 5 — browser, App Connector, Ad Shield, Cyber Lab
- [x] App directory, manual app adding, task-plan preview
- [x] Ad Shield preference and allowlist UI
- [x] Cybersecurity learning cards
- [x] Hacking Center with separate Root Tools and Non-Root Tools directories
- [x] StrykerOSS information cards for rooted and rootless engine types
- [x] Wi-Fi connection status preview using browser-reported connectivity only
- [x] Manual local device notes (not live network discovery)
- [x] Router blacklist/QoS controls clearly marked as requiring a supported router integration
- [x] Wi-Fi security settings checklist
- [x] Permission-confirmed remote-control pairing preview (native companion still required)
- [x] Local offline text-note cache
- [ ] Live router integration and authorized device discovery
- [ ] Native remote companion and secure pairing service
- [ ] Real official app integrations and approved in-app actions
- [ ] Native Android installed-app discovery/automation with permissions
- [ ] Actual compatible browser ad filtering
- [ ] Internal browser with safe browsing/privacy controls
- [ ] Working defensive cybersecurity lab tools with live, permissioned device integrations
- [ ] Screenshot understanding through a connected vision model

## Stage 6 — attachments, multimodal understanding, and advanced reasoning
- [ ] Add a chat composer **+** menu with clear choices for gallery images, camera capture, gallery videos, video recording, documents/files, and voice recordings
- [ ] Show attachment previews, file names, sizes, remove controls, upload progress, and clear unsupported-file errors before sending
- [ ] Add secure, size-limited uploads with server-side MIME/type validation, request limits, and safe temporary-file cleanup
- [ ] Send supported images to vision-capable connected models so users can ask questions about photos and screenshots
- [ ] Add video understanding for supported clips (including safe frame/audio extraction where the chosen provider supports it); do not pretend a video was analyzed when only its filename or thumbnail was received
- [ ] Add document understanding for supported file formats, with extraction limits and clear notices for scanned or unsupported files
- [ ] Add voice-message recording, playback, transcription, and audio understanding when supported by the selected provider
- [ ] Keep camera and microphone access user-initiated, visibly active, permission-based, and easy to stop
- [ ] Add selectable reasoning effort levels, including a branded **100× Thinking** setting for the deepest available effort
- [ ] In 100× Thinking, use the strongest reasoning/model options actually available to the connected provider, allow more time/tokens where supported, compare approaches internally, and perform a final answer check
- [ ] Explain that “100×” is a product mode name, not a measurable promise of 100 times more intelligence; actual reasoning depth depends on provider, model, account access, and limits
- [ ] Keep private internal reasoning hidden; provide useful summaries, conclusions, assumptions, and verification notes instead
- [ ] Add persistent, user-controlled memory with review, correction, export, and deletion controls
- [ ] Add live web search with source links and clear separation between retrieved facts and model-generated analysis
- [ ] Add screenshot and screen-recording understanding where platform permissions and model capabilities allow it
- [ ] Build realtime, natural voice conversation with interruption handling and clear microphone controls
- [ ] Add permission-controlled AI agents for multi-step tasks, with confirmation before consequential external actions
- [ ] Add a code laboratory for writing, explaining, and debugging code in safe, isolated execution environments
- [ ] Expand AI Battle with provider/model availability, per-model usage/cost information, and transparent failure handling
- [ ] Add offline mode using compatible local models where device storage, memory, and performance allow
- [ ] Add automatic tool selection that chooses only available, authorized tools and asks before sensitive actions
- [ ] Test attachments, model capability fallbacks, privacy, security, accessibility, and mobile camera/microphone behavior

## Stage 7 — long-term memory
- [x] Add per-account encrypted memory storage in SQLite
- [x] Add memory create, search, edit, and delete API routes
- [x] Add a memory manager for important notes, school text, project decisions, and screenshot text pasted by the user
- [x] Retrieve relevant saved memories and include them as reference context in future chats
- [x] Add an explicit “remember this:” chat command for saving text
- [ ] Connect screenshot OCR/vision extraction so important image text can be saved automatically
- [ ] Add memory export and bulk-delete controls
- [ ] Test encrypted memory behavior, account isolation, and retrieval quality

## Final testing and release
- [x] JavaScript syntax checks
- [x] HTML ID/reference consistency checks
- [ ] Install backend dependencies successfully
- [ ] Backend API tests
- [ ] Browser/device functional testing
- [ ] Security review, privacy review, and dependency audit
- [ ] Final Android/web packaging and release preparation
- [ ] Create a versioned GitHub Release only after the full app is complete and tested

## Important limitations
- The backend is source code only until it is deployed.
- The current account system has no password recovery or account deletion flow yet.
- Provider API usage and media generation may cost money and depend on account eligibility, model access, and usage limits.
- Browser speech features depend on device/browser support and are not a realtime voice-agent system.
- App Connector and Ad Shield are not yet able to control arbitrary third-party apps or block every ad.
- Attachment types and model capabilities must be verified per provider/model; the interface must never claim that unsupported media was analyzed.
- “100× Thinking” is a branded deep-reasoning mode, not a literal performance multiplier or a guarantee that every connected model supports advanced reasoning.

## Stage 8 — feedback and updates
- [x] Add optional positive/negative response feedback and aggregate counts
- [x] Add automatic stable-release checking in Account Settings and a manual release/install action
- [ ] Publish a signed/versioned stable release with installable update assets

Owner Control Center, owner email verification, cross-account conversation review, moderation dashboard, and admin audit endpoints are not part of this project.
