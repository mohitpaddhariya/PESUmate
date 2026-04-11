// PESUmate — Background Service Worker
// Proxies fetch requests from the content script to bypass CORS restrictions.

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'PESUMATE_FETCH') {
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
    return true;
  }

  if (msg.type === 'PESUMATE_CONVERT_PPT') {
    var webhookUrl = 'https://script.google.com/macros/s/AKfycbxBtkgZn2FRHY4Jv_xO8swN68fpZXqyuw4gcri3Ii8HPwcp4KyYG2dhRHGNhN8z7Abz/exec';

    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        filename: msg.filename,
        fileData: msg.base64Data
      })
    })
      .then(function (resp) {
        return resp.json();
      })
      .then(function (data) {
        if (data.success && data.pdfBase64) {
          sendResponse({ ok: true, pdfBase64: data.pdfBase64 });
        } else {
          sendResponse({ ok: false, error: data.error || 'Conversion failed' });
        }
      })
      .catch(function (err) {
        sendResponse({ ok: false, error: err.message });
      });

    return true;
  }

  return false;
});
