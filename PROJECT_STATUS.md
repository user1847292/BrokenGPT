# BROKENGPT implementation checklist

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
- [x] Composer plus menu for image, video, 3D, game, code, and text-file actions
- [x] Dedicated microphone button beside the send arrow
- [x] Text-file attachment preview (150 KB limit; plain text formats only)
- [x] Iraqi Arabic interface option and existing Malay interface option
- [x] Family Studio shortcuts for Study Mode and Future Vision image prompts
- [ ] Guest text-only AI service (requires a protected, rate-limited server-side model configuration)
- [ ] Google, Apple, and GitHub OAuth (requires provider application credentials and callback-domain setup)
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
- [ ] 3D model generation and export (composer shortcut is a labelled placeholder)
- [ ] Game creation and export workflow (composer shortcut is a labelled placeholder)
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


## Approved update branch
- [x] Composer action menu and voice-input placement
- [x] Safe plain-text file attachment preview
- [x] Family Studio shortcuts (Study Mode and Future Vision prompt)
- [x] Iraqi Arabic locale; Malay locale was already present
- [ ] OAuth sign-in, built-in guest model, 3D generation, and game export remain unimplemented pending required services/configuration
