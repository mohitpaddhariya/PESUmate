// PESUmate — Bridge Script (ISOLATED world)
// Relays fetch requests between the MAIN world content script and the
// background service worker via window.postMessage ↔ chrome.runtime.sendMessage.

(function () {
  'use strict';

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (!event.data || event.data.type !== 'PESUMATE_FETCH') return;

    var requestId = event.data.requestId;
    var url = event.data.url;

    chrome.runtime.sendMessage(
      { type: 'PESUMATE_FETCH', url: url },
      function (response) {
        window.postMessage({
          type: 'PESUMATE_FETCH_RESP',
          requestId: requestId,
          response: response || { ok: false, error: 'No response from background' }
        }, '*');
      }
    );
  });
})();
