// PESUmate — Bridge Script (ISOLATED world)
// Relays messages between MAIN world content script and background service worker
// Also exposes the extension's base URL to the MAIN world

// ─── Expose extension URL to MAIN world ───
// MAIN world scripts can't access chrome.runtime.getURL, so we pass it via DOM
(function () {
    var meta = document.createElement('meta');
    meta.name = 'pesumate-extension-url';
    meta.content = chrome.runtime.getURL('');
    document.head.appendChild(meta);
})();

// ─── Message relay ───
window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.direction !== 'pesumate-to-background') return;

    const msg = event.data.payload;
    const id = event.data.id;

    try {
        const response = await chrome.runtime.sendMessage(msg);
        window.postMessage({
            direction: 'pesumate-from-background',
            id: id,
            payload: response
        }, '*');
    } catch (err) {
        window.postMessage({
            direction: 'pesumate-from-background',
            id: id,
            payload: { error: 'BRIDGE_ERROR', message: err.message }
        }, '*');
    }
});
