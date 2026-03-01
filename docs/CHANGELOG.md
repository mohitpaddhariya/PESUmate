# Changelog

All notable changes to PESUmate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-28

### Added
- **PESUmate AI Chat**: A new floating chat interface allowing students to select course slides and chat with an AI study assistant powered by Google Gemini.
- **Fullscreen Study Mode**: Immersive side-by-side layout with slides filling the viewport and a dedicated resizable chat drawer on the right.
- **Inline Focus Mode (Split View)**: DnD splitter between slides and chat within the sidebar — persisted split ratio via localStorage.
- **Auto-scroll to Source Page**: During AI streaming, the viewer automatically scrolls to the slide page being referenced, with clickable source pills for quick navigation.
- **Centered Modal Slide Picker**: Add more slides to context mid-conversation via a centered modal overlay with backdrop blur.
- **Collapsible Chat Drawer + FAB**: Collapse the fullscreen chat drawer; reopen via a floating action button with the PESUmate icon.
- **Native Slide & PDF Preview**: View loaded PDF/PPTX slides visually in inline preview or fullscreen. Supports multi-file tabs.
- Per-page text extraction for accurate page-level source attribution.
- Chat history panel to save and resume conversations about specific course units.
- Input in the popup extension to allow users to bring their own Gemini API key.
- Creator branding and open source links added to the popup and chat UI.
- `icon.png` added to `web_accessible_resources` for the FAB button.

### Improved
- Completely redesigned the context UI: expandable banner with individual slide status and preview buttons.
- Retina slide rendering: canvas uses `Math.max(devicePixelRatio, 2)` for crisp fullscreen output.
- Reliable render width via `getInlineRenderWidth()` — replaces brittle `container.clientWidth`.
- PPTX sizing uses `aspect-ratio: 4/3` CSS instead of hardcoded pixel heights.
- Fullscreen header hides irrelevant buttons — only the exit button remains; drawer header has + Slides, History, Clear, and Collapse.
- Slides never hide behind the chat drawer (preview `marginRight` tracks drawer width).
- Refined the AI System Prompt to enforce an academic tone, forbid emojis, and provide college-appropriate chat suggestions.

### Changed
- Reorganized the entire codebase into a modern `src/` directory structure (`src/scripts`, `src/styles`, `src/pages`), greatly improving maintainability.

## [1.0.0] - 2026-02-25

### Added
- Chrome extension (Manifest V3) with content script injection
- "PESUmate" tab injected into PESU Academy course unit navigation
- Floating download panel with file listing and progress bar
- PDF merging — all PDF slides merged into a single file via pdf-lib
- PPTX zipping — all PowerPoint files bundled into a ZIP via JSZip
- Individual file download via click
- In-memory caching per unit tab — instant re-renders on tab switch
- Automatic tab change detection via MutationObserver
- Force refetch button to bypass cache
- PESU Academy themed UI (#0091CD blue, #1d3756 dark text)
- Toolbar popup with usage instructions
- Bundled pdf-lib v1.17.1 and JSZip v3.10.1 locally (no CDN)
