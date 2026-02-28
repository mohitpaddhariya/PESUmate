# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.0.x   | Yes       |
| 1.0.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in PESUmate, please report it responsibly.

**Do not open a public issue for security vulnerabilities.**

Instead, email the maintainer directly or use GitHub's private vulnerability reporting feature if available.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: within 48 hours
- **Assessment**: within 1 week
- **Fix release**: as soon as practical, depending on severity

## Security considerations

PESUmate is a client-side Chrome extension. Important notes:

- **No data collection**: The extension does not collect, store, or transmit any user data
- **No external requests**: All network requests go exclusively to `pesuacademy.com` using your existing session
- **No background processes**: The extension only runs when you're on a PESU Academy page
- **Session cookies**: The extension uses your browser's existing session cookies — it does not read, store, or expose them
- **Local processing**: PDF merging, ZIP creation, and PPTX rendering happen entirely inside the browser
- **Bundled libraries**: pdf-lib, JSZip, and pptx-to-html are bundled locally — no CDN or third-party script loading at runtime

## Permissions

The extension requests minimal permissions:

| Permission | Reason |
|-----------|--------|
| `host_permissions: pesuacademy.com` | Required to inject the content script and access course APIs |
| `storage` | Required to securely store user-provided Gemini API keys and local chat history |

No other permissions (tabs, webRequest, etc.) are requested.
