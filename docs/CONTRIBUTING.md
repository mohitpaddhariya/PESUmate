# Contributing to PESUmate

Thank you for considering contributing to PESUmate! This document outlines how to get involved.

## How to contribute

### Reporting bugs

1. Check [existing issues](https://github.com/mohitpaddhariya/PESUmate/issues) to avoid duplicates
2. Open a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Browser version and OS
   - Screenshots or console logs if applicable

### Suggesting features

Open an issue with the `enhancement` label. Describe:
- What problem the feature solves
- How you envision it working
- Any alternatives you've considered

### Submitting code

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** — keep commits focused and atomic
4. **Test** your changes:
   - Load the extension in Chrome developer mode
   - Verify on a live PESU Academy course page
   - Check the browser console for errors
5. **Push** your branch and open a **Pull Request**

## Development setup

```bash
git clone https://github.com/mohitpaddhariya/PESUmate.git
cd PESUmate
```

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `PESUmate` folder
4. Navigate to PESU Academy to test

After making changes to `content.js` or `panel.css`:
- Click the refresh icon on the extension card in `chrome://extensions`
- Reload the PESU Academy page

See [DEVELOPER.md](DEVELOPER.md) for architecture details (in this same `docs/` folder).

## Code style

- Use `'use strict'` in all scripts
- Prefer `const` and `let` over `var`
- Use meaningful variable names
- Keep functions focused — one responsibility per function
- Add `[PESUmate]` prefix to all `console.log` messages
- No external dependencies beyond pdf-lib and JSZip (both bundled)
- jQuery is used from the host page — do not bundle it

## Commit messages

Use clear, concise commit messages:

```
feat: add batch download progress percentage
fix: handle empty unit response from API
docs: update developer guide with caching section
style: align panel close button
refactor: extract file type detection into helper
```

Prefix with: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

## Pull request guidelines

- Reference any related issues (e.g., "Fixes #12")
- Describe what changed and why
- Keep PRs focused — one feature or fix per PR
- Ensure no console errors on PESU Academy pages
- Update documentation if your change affects usage or architecture

## What we're looking for

- Bug fixes and reliability improvements
- Support for additional file types
- UI/UX improvements to the download panel
- Performance optimizations
- Better error handling and user feedback
- Documentation improvements

## Code of conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md) (in this same `docs/` folder). By participating, you agree to uphold it.

## Questions?

Open an issue with the `question` label or reach out to the maintainer.
