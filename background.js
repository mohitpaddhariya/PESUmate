// PESUmate — Background Service Worker
// Proxies fetch requests from the content script to bypass CORS restrictions.

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type !== 'PESUMATE_FETCH') return false;

  fetch(msg.url, { credentials: 'include', redirect: 'follow' })
    .then(function (resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var cd = resp.headers.get('Content-Disposition') || '';
      return resp.arrayBuffer().then(function (buf) {
        sendResponse({
          ok: true,
          data: Array.from(new Uint8Array(buf)),
          contentDisposition: cd
        });
      });
    })
    .catch(function (err) {
      sendResponse({ ok: false, error: err.message });
    });

  return true; // keep message channel open for async sendResponse
});
