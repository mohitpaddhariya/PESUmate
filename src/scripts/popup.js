const input = document.getElementById('apiKeyInput');
const saveBtn = document.getElementById('saveKeyBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const toast = document.getElementById('toast');

// Load existing key on open
chrome.storage.sync.get('geminiApiKey', (data) => {
    if (data.geminiApiKey) {
        input.value = data.geminiApiKey;
        setStatus(true);
    }
});

// Save key
saveBtn.addEventListener('click', () => {
    const key = input.value.trim();
    if (!key) {
        showToast('Please enter an API key', 'error');
        return;
    }
    saveBtn.disabled = true;
    saveBtn.textContent = '...';
    chrome.storage.sync.set({ geminiApiKey: key }, () => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
        if (chrome.runtime.lastError) {
            showToast('Failed to save: ' + chrome.runtime.lastError.message, 'error');
        } else {
            setStatus(true);
            showToast('API key saved!', 'success');
        }
    });
});

// Enter key to save
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
});

function setStatus(connected) {
    statusDot.className = 'status-dot ' + (connected ? 'connected' : 'disconnected');
    statusText.textContent = connected ? 'Key saved — ready to chat' : 'No key set';
}

function showToast(msg, type) {
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 2500);
}
