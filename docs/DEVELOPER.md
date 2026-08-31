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
  → injects "PESUmate" tab + floating panel
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

## API flow (DOM-first discovery)

PESU Academy doesn't expose direct download URLs on the page.

> **Historical note.** Until v1.1.0 this was a 5-step chain that called
> `/Academy/a/i/getCourse/{subjectid}` and `/Academy/a/i/getCourseClasses/{unitId}`.
> `/Academy/a/i/*` is the **admin** namespace and now returns
> `403 Access denied for student role` for every student account, so those two
> calls are gone. Everything they returned is already present in the page DOM,
> and the site's own JavaScript never called them either.

### Step 1 - Subject ID and class list (no network)

Every class link on the page carries all the identifiers needed:

```
handleclasscoursecontentunit('<classUuid>','<subjectid>','<coursecontentid>','<classNo>',<type>,event)
                              \________/  \__________/
                              class UUID    subject ID
```

```
DOM -> [onclick*="handleclasscoursecontentunit"]
  -> regex -> classUuid (group 1), subjectid (group 2)
  -> dedup on classUuid
```

A class appears once per content `type` (1,2,3,5,...,10), so the same UUID repeats
several times and must be de-duplicated. The `type` argument is **ignored by the
server** - all values return an identical response, so there is nothing to iterate.

The unit tabs likewise carry their own ID via `handleclassUnit('<coursecontentid>')`
on `#courselistunit li a`, which is what replaced the `getCourse` unit list.

### Step 2 - Scan download links

For each distinct class UUID:

```
GET /Academy/s/studentProfilePESUAdmin
  ?controllerMode=6403
  &actionType=60
  &selectedData={subjectid}
  &id=2
  &unitid={classUuid}      <- the UUID, NOT the numeric unit id
  -> returns HTML with the slide viewer markup
```

`unitid` must be the class UUID. Passing the numeric `coursecontentid` returns the
MCQ/quiz pane instead, which contains no download links - a silent wrong-pane bug
rather than an error.

Download links are extracted from two patterns:

| Pattern | Type | Extraction |
|---------|------|------------|
| `downloadslidecoursedoc` inside `loadIframe('url')` | Slide (PDF/PPTX) | URL from `loadIframe()`, `#view=...` fragment stripped |
| `downloadcoursedoc('uuid')` | Regular doc (PDF) | UUID -> `/Academy/s/referenceMeterials/downloadcoursedoc/{uuid}` |

The live markup is:

```html
<a href="#" onclick="loadIframe('/Academy/a/referenceMeterials/downloadslidecoursedoc/<uuid>#view=FitH&toolbar=0&navpanes=0&scrollbar=0','<uuid>')">
```

Deduplication via `Set` on IDs/URLs.

### CSRF

The site's own `doAjaxCall()` sends `X-CSRF-Token` from
`<meta name="csrf-token">` on every request. `apiGet()` in `content.js` does the
same, so extension requests are indistinguishable from the page's.

Regression coverage for both regexes lives in `scripts/test-scrape.mjs`
(`node scripts/test-scrape.mjs`), pinned against markup captured from the live site.

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
