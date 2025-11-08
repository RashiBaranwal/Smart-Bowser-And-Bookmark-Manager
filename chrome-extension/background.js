const HISTORY_API_URL = 'http://localhost:5000/api/browser-history';
const BOOKMARKS_API_URL = 'http://localhost:5000/api/bookmarks';

// Function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return '';
  }
}

// Function to send history item to backend
async function sendHistoryItem(item) {
  try {
    const response = await fetch(HISTORY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        historyId: item.id,
        url: item.url,
        title: item.title || 'Untitled',
        visitTime: new Date(item.lastVisitTime),
        visitCount: item.visitCount || 1,
        domain: extractDomain(item.url),
        favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(item.url)}&sz=32`
      }),
    });

    if (!response.ok) {
      console.error('Failed to sync history item:', await response.text());
    }
  } catch (error) {
    console.error('Error sending history item:', error);
  }
}

// Function to send bulk history items
async function sendBulkHistory(items) {
  try {
    const entries = items.map(item => ({
      historyId: item.id,
      url: item.url,
      title: item.title || 'Untitled',
      visitTime: new Date(item.lastVisitTime),
      visitCount: item.visitCount || 1,
      domain: extractDomain(item.url),
      favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(item.url)}&sz=32`
    }));

    const response = await fetch(`${HISTORY_API_URL}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      console.error('Failed to sync bulk history:', await response.text());
    } else {
      const result = await response.json();
      console.log(`Successfully synced ${result.count} history items`);
    }
  } catch (error) {
    console.error('Error sending bulk history:', error);
  }
}

// Function to fetch and sync last 30 days of history
async function syncInitialHistory() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    chrome.history.search(
      {
        text: '',
        startTime: thirtyDaysAgo.getTime(),
        maxResults: 10000
      },
      async (historyItems) => {
        console.log(`Found ${historyItems.length} history items from last 30 days`);

        // Send in batches of 100
        const batchSize = 100;
        for (let i = 0; i < historyItems.length; i += batchSize) {
          const batch = historyItems.slice(i, i + batchSize);
          await sendBulkHistory(batch);
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Mark initial sync as complete
        chrome.storage.local.set({ initialSyncComplete: true });
        console.log('Initial history sync complete');
      }
    );
  } catch (error) {
    console.error('Error during initial sync:', error);
  }
}

// ========== BOOKMARK SYNCING FUNCTIONS ==========

// Function to process bookmark tree and flatten it
function flattenBookmarkTree(bookmarkNodes, folderPath = []) {
  let bookmarks = [];

  for (const node of bookmarkNodes) {
    if (node.url) {
      // This is a bookmark (not a folder)
      bookmarks.push({
        bookmarkId: node.id,
        title: node.title || 'Untitled',
        url: node.url,
        dateAdded: new Date(node.dateAdded),
        parentFolder: folderPath.length > 0 ? folderPath[folderPath.length - 1] : 'Other Bookmarks',
        folderPath: [...folderPath],
        domain: extractDomain(node.url),
        favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(node.url)}&sz=32`,
        tags: []
      });
    } else if (node.children) {
      // This is a folder, recurse into it
      const newPath = [...folderPath, node.title];
      bookmarks = bookmarks.concat(flattenBookmarkTree(node.children, newPath));
    }
  }

  return bookmarks;
}

// Function to send bulk bookmarks
async function sendBulkBookmarks(bookmarks) {
  try {
    const response = await fetch(`${BOOKMARKS_API_URL}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookmarks }),
    });

    if (!response.ok) {
      console.error('Failed to sync bulk bookmarks:', await response.text());
    } else {
      const result = await response.json();
      console.log(`Successfully synced ${result.count} bookmarks`);
    }
  } catch (error) {
    console.error('Error sending bulk bookmarks:', error);
  }
}

// Function to sync all bookmarks
async function syncAllBookmarks() {
  try {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      const bookmarks = flattenBookmarkTree(bookmarkTreeNodes);
      console.log(`Found ${bookmarks.length} bookmarks`);

      // Send in batches of 100
      const batchSize = 100;
      (async () => {
        for (let i = 0; i < bookmarks.length; i += batchSize) {
          const batch = bookmarks.slice(i, i + batchSize);
          await sendBulkBookmarks(batch);
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Mark bookmark sync as complete
        chrome.storage.local.set({ bookmarkSyncComplete: true });
        console.log('Bookmark sync complete');
      })();
    });
  } catch (error) {
    console.error('Error during bookmark sync:', error);
  }
}

// Function to send single bookmark
async function sendBookmark(bookmark) {
  try {
    const response = await fetch(BOOKMARKS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookmark),
    });

    if (!response.ok) {
      console.error('Failed to sync bookmark:', await response.text());
    }
  } catch (error) {
    console.error('Error sending bookmark:', error);
  }
}

// Listen for new bookmarks being created
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  if (bookmark.url) {
    console.log('New bookmark created:', bookmark.title);
    chrome.bookmarks.get(id, (results) => {
      const node = results[0];
      sendBookmark({
        bookmarkId: node.id,
        title: node.title || 'Untitled',
        url: node.url,
        dateAdded: new Date(node.dateAdded),
        parentFolder: 'Other Bookmarks',
        folderPath: [],
        domain: extractDomain(node.url),
        favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(node.url)}&sz=32`,
        tags: []
      });
    });
  }
});

// Listen for bookmarks being removed
chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  console.log('Bookmark removed:', id);
  // You could add logic here to sync deletions with your backend
});

// Listen for bookmarks being changed
chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  console.log('Bookmark changed:', id, changeInfo);
  // Re-sync this bookmark
  chrome.bookmarks.get(id, (results) => {
    if (results[0] && results[0].url) {
      const node = results[0];
      sendBookmark({
        bookmarkId: node.id,
        title: node.title || 'Untitled',
        url: node.url,
        dateAdded: new Date(node.dateAdded || Date.now()),
        parentFolder: 'Other Bookmarks',
        folderPath: [],
        domain: extractDomain(node.url),
        favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(node.url)}&sz=32`,
        tags: []
      });
    }
  });
});

// ========== HISTORY TRACKING ==========

// Listen for new history visits (real-time tracking)
chrome.history.onVisited.addListener((historyItem) => {
  console.log('New page visited:', historyItem.url);
  sendHistoryItem(historyItem);
});

// Listen for when history item is removed
chrome.history.onVisitRemoved.addListener((removed) => {
  console.log('History item removed:', removed);
  // You could add logic here to sync deletions with your backend
});

// Check if initial sync is needed when extension loads
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Extension installed, starting initial sync...');
    await syncInitialHistory();
    await syncAllBookmarks();
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Check on startup if initial sync was completed
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['initialSyncComplete', 'bookmarkSyncComplete'], (result) => {
    if (!result.initialSyncComplete) {
      console.log('Initial history sync incomplete, starting sync...');
      syncInitialHistory();
    }
    if (!result.bookmarkSyncComplete) {
      console.log('Initial bookmark sync incomplete, starting sync...');
      syncAllBookmarks();
    }
    if (result.initialSyncComplete && result.bookmarkSyncComplete) {
      console.log('History and bookmarks tracking active');
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'manualSync') {
    console.log('Manual sync requested');
    Promise.all([syncInitialHistory(), syncAllBookmarks()]).then(() => {
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }

  if (request.action === 'syncBookmarks') {
    console.log('Manual bookmark sync requested');
    syncAllBookmarks().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log('Browser History & Bookmarks Retriever extension loaded');
