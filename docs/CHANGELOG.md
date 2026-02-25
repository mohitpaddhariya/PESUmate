# Changelog

All notable changes to PESUmate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
