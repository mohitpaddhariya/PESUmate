// PESUmate — Bridge Script (ISOLATED world)
// Relays fetch requests between the MAIN world content script and the
// background service worker via window.postMessage ↔ chrome.runtime.sendMessage.

(function () {
  'use strict';

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (!event.data || (event.data.type !== 'PESUMATE_FETCH' && event.data.type !== 'PESUMATE_CONVERT_PPT')) return;

    var requestId = event.data.requestId;
    
    if (event.data.type === 'PESUMATE_FETCH') {
      chrome.runtime.sendMessage(
        { type: 'PESUMATE_FETCH', url: event.data.url },
        function (response) {
          window.postMessage({
            type: 'PESUMATE_FETCH_RESP',
            requestId: requestId,
            response: response || { ok: false, error: 'No response from background' }
          }, '*');
        }
      );
    } else if (event.data.type === 'PESUMATE_CONVERT_PPT') {
      chrome.runtime.sendMessage(
        { type: 'PESUMATE_CONVERT_PPT', filename: event.data.filename, base64Data: event.data.base64Data },
        function (response) {
          window.postMessage({
            type: 'PESUMATE_CONVERT_RESP',
            requestId: requestId,
            response: response || { ok: false, error: 'No response from background' }
          }, '*');
        }
      );
    }
  });
})();
