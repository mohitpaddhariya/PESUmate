# PESUmate — Developer Guide

Technical documentation covering the architecture, API flow, and internals of the PESUmate Chrome extension.

---

## Architecture

PESUmate is a **Manifest V3 Chrome extension** that injects a content script into PESU Academy pages. The content script adds UI elements to the DOM and communicates with PESU Academy's internal APIs using the user's existing session.

```
manifest.json
  └─ content_scripts
       ├─ lib/pdf-lib.min.js   (injected first)
       ├─ lib/jszip.min.js     (injected second)
       ├─ content.js           (main logic)
       └─ panel.css            (styles)
```

### Execution flow

```
Page load → manifest injects scripts at document_idle
  → content.js waits for jQuery (from PESU page)
  → checks for #courselistunit
  → injects "Download All" tab + floating panel
  → waits for user interaction
  → fetch → render → cache
```

---

## File overview

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3). Declares content scripts, permissions, icons, popup. |
| `content.js` | Core logic: DOM injection, API calls, PDF merge, PPTX zip, caching, tab observer. |
| `panel.css` | All styles for the download panel. PESU-themed colors (#0091CD, #1d3756). |
| `popup.html` | Toolbar popup. Shows extension info and usage hint. |
| `lib/pdf-lib.min.js` | pdf-lib v1.17.1 — client-side PDF creation and merging. |
| `lib/jszip.min.js` | JSZip v3.10.1 — client-side ZIP file generation. |

---

## API flow (3-step discovery)

PESU Academy doesn't expose direct download URLs on the page.

### Step 1 — Extract subject ID

```
DOM → #CourseContentId [onclick*="handleclasscoursecontentunit"]
  → regex match → subjectid
```

The `subjectid` is embedded in `onclick` attributes of elements inside the course content area.

### Step 2 — Get units

```
GET /Academy/a/i/getCourse/{subjectid}
  → returns HTML <option> elements
  → parsed into [{id, name}, ...]
```

Returns all units for the subject (e.g., "NLP Basics", "Prompt and RAG").

### Step 3 — Match active unit

The script reads the active tab text from `#courselistunit li.active a` and fuzzy-matches it against the unit list:

1. Exact substring match
2. Case-insensitive match
3. Word-overlap scoring (fuzzy)
4. Fallback to first unit

### Step 4 — Get classes

```
GET /Academy/a/i/getCourseClasses/{unitId}
  → returns HTML <option> elements
  → parsed into [{id, name}, ...]
```

Returns all classes (lectures/sessions) within the matched unit.

### Step 5 — Scan download links

For each class:

```
GET /Academy/s/studentProfilePESUAdmin
  ?controllerMode=6403
  &actionType=60
  &selectedData={subjectid}
  &id=2
  &unitid={classId}
  → returns HTML with download links
```

Two download patterns are extracted:

| Pattern | Type | Extraction |
|---------|------|------------|
| `downloadcoursedoc('uuid')` | Regular doc (PDF) | UUID → `/Academy/s/referenceMeterials/downloadcoursedoc/{uuid}` |
| `downloadslidecoursedoc` inside `loadIframe('url')` | Slide (PDF/PPTX) | Full URL from `loadIframe()` |

Deduplication via `Set` on IDs/URLs.

---

## Download and merge logic

### Magic byte detection

After fetching each file as `ArrayBuffer`, the script checks the first bytes:

| Bytes | Type | Action |
|-------|------|--------|
| `%PDF` (25 50 44 46) | PDF | Merge into combined PDF |
| `PK` (50 4B) | ZIP (PPTX/DOCX) | Add to PPTX ZIP bundle |
| Other | Unknown | Skip |

### PDF merging (pdf-lib)

```javascript
PDFDocument.create()                    // empty merged doc
PDFDocument.load(arrayBuf)              // load source PDF
mergedPdf.copyPages(src, indices)       // copy all pages
mergedPdf.addPage(page)                 // append
mergedPdf.save()                        // serialize → Blob → download
```

Output: `{UnitName}_Merged.pdf`

### PPTX zipping (JSZip)

```javascript
const zip = new JSZip();
pptxFiles.forEach(f => zip.file(f.name, f.data));
zip.generateAsync({ type: 'blob' });    // → download
```

Output: `{UnitName}_PPTX_files.zip`

Filename deduplication appends `(1)`, `(2)`, etc. for collisions.

---

## Caching

```javascript
const cache = {};                       // in-memory, per page session
cache[activeUnitText] = downloadItems;
```

- **Key**: Unit tab text (e.g., "NLP Basics, Pre-Trained Models")
- **Value**: Array of `{title, id, className, isSlideUrl?}` objects
- **Cache hit**: Skips all API calls, renders instantly with "cached" indicator
- **Force refresh**: Refetch button passes `force=true`, bypasses cache
- **Lifetime**: Lives in the content script closure — cleared on page reload

---

## Tab change detection

```javascript
new MutationObserver(callback)
  .observe(#courselistunit, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
```

Watches for `class` attribute changes on unit tabs. When the active tab changes and the panel is visible, triggers `fetchAndRender()`.

---

## Server security notes

PESU Academy validates `Sec-Fetch-Dest` headers:

| Method | Sec-Fetch-Dest | Result |
|--------|---------------|--------|
| `<a>` click | `document` | Works |
| `fetch()` | `empty` | Works (with `credentials: 'same-origin'`) |
| `<iframe>` | `iframe` | 500 error |

The extension uses:
- `fetch()` with `credentials: 'same-origin'` for the merge/zip flow
- Hidden `<a download>` elements for individual file downloads

---

## Key variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `cache` | Closure | Download items cache per unit |
| `_fetching` | Closure | Lock flag — prevents concurrent fetches |
| `_lastRenderedTab` | Closure | Tracks which tab the panel was last rendered for |
| `_lastActiveTab` | Closure | Last active tab text for observer change detection |

---

## Development setup

1. Clone the repo and make changes
2. Go to `chrome://extensions` → enable Developer mode
3. Click **Load unpacked** → select the project folder
4. After editing `content.js` or `panel.css`, click the refresh icon on the extension card
5. Reload the PESU Academy page to see changes

### Debugging

- Open DevTools on the PESU Academy page
- Filter console by `[PESUmate]` to see extension logs
- The content script runs in the page's main world (same as jQuery)
- Use the Sources tab → Content scripts → PESUmate to set breakpoints

---

## Dependencies

| Library | Version | Size | Purpose | License |
|---------|---------|------|---------|---------|
| pdf-lib | 1.17.1 | ~525 KB | PDF merging | MIT |
| JSZip | 3.10.1 | ~98 KB | ZIP creation | MIT / GPLv3 |

Both are bundled locally in `lib/` — no CDN calls at runtime.
