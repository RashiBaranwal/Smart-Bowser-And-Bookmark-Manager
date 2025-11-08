document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('syncBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const statusEl = document.getElementById('status');
  const messageEl = document.getElementById('message');

  // Check sync status
  chrome.storage.local.get(['initialSyncComplete'], (result) => {
    if (result.initialSyncComplete) {
      statusEl.textContent = '✓ Active & Syncing';
    } else {
      statusEl.textContent = '⚠ Initial sync in progress...';
    }
  });

  // Show message
  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = type;
    setTimeout(() => {
      messageEl.className = '';
      messageEl.style.display = 'none';
    }, 3000);
  }

  // Sync button
  syncBtn.addEventListener('click', () => {
    syncBtn.textContent = 'Syncing...';
    syncBtn.disabled = true;

    chrome.runtime.sendMessage({ action: 'manualSync' }, (response) => {
      syncBtn.textContent = 'Sync History Now';
      syncBtn.disabled = false;

      if (response && response.success) {
        showMessage('History synced successfully!', 'success');
      } else {
        showMessage('Failed to sync history', 'error');
      }
    });
  });

  // Dashboard button
  dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173' });
  });

  // Settings button
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
