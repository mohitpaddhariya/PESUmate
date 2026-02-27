// Handles API key storage and Gemini API calls

importScripts('prompt.js');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ─── Message Handler ───
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
        case 'GET_API_KEY':
            chrome.storage.sync.get('geminiApiKey', (data) => {
                sendResponse({ key: data.geminiApiKey || '' });
            });
            return true; // async

        case 'SET_API_KEY':
            chrome.storage.sync.set({ geminiApiKey: msg.key }, () => {
                sendResponse({ success: true });
            });
            return true;

        case 'CHAT_REQUEST':
            handleChat(msg, sendResponse);
            return true;

        case 'SAVE_CHAT_HISTORY':
            chrome.storage.local.set({ ['chat_' + msg.unit]: msg.data }, () => {
                sendResponse({ success: true });
            });
            return true;

        case 'LOAD_CHAT_HISTORY':
            chrome.storage.local.get('chat_' + msg.unit, (result) => {
                sendResponse({ data: result['chat_' + msg.unit] || null });
            });
            return true;

        case 'CLEAR_CHAT_HISTORY':
            chrome.storage.local.remove('chat_' + msg.unit, () => {
                sendResponse({ success: true });
            });
            return true;

        case 'LIST_CHAT_HISTORY':
            chrome.storage.local.get(null, (all) => {
                var entries = [];
                for (var key in all) {
                    if (key.startsWith('chat_') && all[key] && all[key].messages) {
                        entries.push({ unit: key.replace('chat_', ''), data: all[key] });
                    }
                }
                sendResponse({ entries: entries });
            });
            return true;

        default:
            return false;
    }
});

// ─── Gemini Chat Handler ───
async function handleChat(msg, sendResponse) {
    try {
        const data = await chrome.storage.sync.get('geminiApiKey');
        const apiKey = data.geminiApiKey;

        if (!apiKey) {
            sendResponse({ error: 'NO_API_KEY', message: 'Please set your Gemini API key in the PESUmate popup.' });
            return;
        }

        // Build the Gemini request
        const contents = buildGeminiContents(msg.context, msg.messages);

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    maxOutputTokens: 8192,
                },
                systemInstruction: {
                    parts: [{
                        text: PESUMATE_SYSTEM_PROMPT
                    }]
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            if (response.status === 400) {
                sendResponse({ error: 'BAD_REQUEST', message: 'Invalid request. Your API key may be incorrect.' });
            } else if (response.status === 429) {
                sendResponse({ error: 'RATE_LIMIT', message: 'Rate limit exceeded. Please wait a moment or change your API key in the extension popup.' });
            } else if (response.status === 403) {
                sendResponse({ error: 'FORBIDDEN', message: 'API key is invalid or restricted. Please check your key.' });
            } else {
                sendResponse({ error: 'API_ERROR', message: `API error (${response.status}): ${errBody.slice(0, 200)}` });
            }
            return;
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        sendResponse({ success: true, text: text });

    } catch (err) {
        console.error('[PESUmate] Chat error:', err);
        sendResponse({ error: 'NETWORK_ERROR', message: 'Network error. Please check your connection.' });
    }
}

// ─── Build Gemini Contents ───
function buildGeminiContents(context, messages) {
    const contents = [];

    // First message includes the slide context
    if (context && messages.length > 0) {
        const firstUserMsg = messages[0];
        contents.push({
            role: 'user',
            parts: [{
                text: `Here is the content from my course slides:\n\n---\n${context}\n---\n\nBased on the above slide content, please answer my question:\n${firstUserMsg.text}`
            }]
        });

        // Add remaining messages
        for (let i = 1; i < messages.length; i++) {
            contents.push({
                role: messages[i].role === 'user' ? 'user' : 'model',
                parts: [{ text: messages[i].text }]
            });
        }
    }

    return contents;
}
