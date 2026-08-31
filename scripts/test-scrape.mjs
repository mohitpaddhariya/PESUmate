// Self-checks for the DOM scraping in content.js, exercised against real markup
// captured from pesuacademy.com. The regexes are pulled out of content.js itself,
// so this tests the shipped code rather than a copy of it.
// Run: node scripts/test-scrape.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../content.js', import.meta.url), 'utf8');

function regexFrom(marker) {
  // Grab the /.../ literal on the line where content.js uses `marker`.
  const line = src.split('\n').find(l => l.includes(marker) && l.includes('.match(/'));
  assert.ok(line, `no .match(/.../) line containing ${marker}`);
  const body = line.slice(line.indexOf('.match(/') + 8, line.lastIndexOf('/'));
  return new RegExp(body);
}

// --- 1. Class list: handleclasscoursecontentunit(classUuid, subjectid, ...) ---
const CLASS_RE = regexFrom('handleclasscoursecontentunit');

// Real onclicks: a class repeats once per content type, so dedup must collapse them.
const onclicks = [
  "handleclasscoursecontentunit('3f0ce449-ec4d-449a-a113-f9233218bbb5','22902','69624','1',1,event)",
  "handleclasscoursecontentunit('3f0ce449-ec4d-449a-a113-f9233218bbb5','22902','69624','1',10,event)",
  "handleclasscoursecontentunit('3f0ce449-ec4d-449a-a113-f9233218bbb5','22902','69624','1',2,event)",
  "handleclasscoursecontentunit('7c4bce4b-6aa8-466a-a267-d01e32da40cf','22902','69624','2',1,event)",
  "handleclasscoursecontentunit('7c4bce4b-6aa8-466a-a267-d01e32da40cf','22902','69624','2',5,event)",
  "handleclasscoursecontentunit('262140ec-5355-4b62-8081-8c4641c7686d','22902','69624','3',8,event)",
];
let subjectid = null;
const seen = new Set();
for (const oc of onclicks) {
  const m = oc.match(CLASS_RE);
  assert.ok(m, `no match: ${oc}`);
  if (!subjectid) subjectid = m[2];
  seen.add(m[1]);
}
assert.equal(subjectid, '22902', 'subject id is the SECOND argument, not the first');
assert.equal(seen.size, 3, '6 onclicks over 3 distinct classes must dedup to 3');
assert.ok(!seen.has('22902'), 'subject id must never be used as a class id');

// --- 2. Slide URL: onclick="loadIframe('<url>#view=...','<uuid>')" ---
const SLIDE_RE = regexFrom('loadIframe');
const slideOnclick =
  "loadIframe('/Academy/a/referenceMeterials/downloadslidecoursedoc/3ed71b6a-5ca5-424d-a549-570b1f08fe97" +
  "#view=FitH&toolbar=0&navpanes=0&scrollbar=0','3ed71b6a-5ca5-424d-a549-570b1f08fe97')";
const sm = slideOnclick.match(SLIDE_RE);
assert.ok(sm, 'slide onclick did not match');
assert.equal(sm[1].split('#')[0],
  '/Academy/a/referenceMeterials/downloadslidecoursedoc/3ed71b6a-5ca5-424d-a549-570b1f08fe97',
  'the #view= fragment must be stripped before fetching');
assert.ok(src.includes('downloadslidecoursedoc'),
  'the [onclick*="downloadslidecoursedoc"] selector must still match this markup');

// --- 3. The dead admin endpoints must not come back ---
// Comments are stripped first: content.js documents these URLs on purpose, to
// explain why they are gone. Only live code may not reference them.
const code = src.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
assert.ok(!code.includes('/Academy/a/i/getCourse'),
  'getCourse is admin-only (403 "Access denied for student role") - do not reintroduce');
assert.ok(!code.includes('/Academy/a/i/getCourseClasses'),
  'getCourseClasses is admin-only (403) - do not reintroduce');

console.log('scrape: all checks passed');
