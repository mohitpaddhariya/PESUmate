document.addEventListener('DOMContentLoaded', () => {
  // Load existing key
  chrome.storage.local.get(['convertApiKey'], (result) => {
    if (result.convertApiKey) {
      document.getElementById('convertApiKey').value = result.convertApiKey;
    }
  });

  // Save key
  document.getElementById('saveBtn').addEventListener('click', () => {
    const key = document.getElementById('convertApiKey').value.trim();
    chrome.storage.local.set({ convertApiKey: key }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Settings saved.';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
  });
});
