# Browser History & Bookmarks Retriever

A full-stack MERN application that tracks and displays your Chrome browser history AND bookmarks in real-time with a beautiful dashboard interface and instant search capabilities.

## Features

### Instant Search
- **Unified Search**: Search across BOTH browser history and bookmarks simultaneously
- **Real-time Results**: Results appear instantly as you type
- **Smart Filtering**: Filter results by type (All, Bookmarks, History)
- **Keyword Matching**: Search by page title, URL, domain, or folder name

### Browser History Tracking
- **Real-time Tracking**: Chrome extension captures browsing history as you browse
- **Initial Sync**: Loads last 30 days of browser history on installation
- **Visit Count**: Tracks how many times you've visited each page
- **Live Updates**: Dashboard auto-refreshes every 10 seconds

### Bookmarks Management
- **Full Bookmark Sync**: Syncs all your Chrome bookmarks automatically
- **Folder Organization**: Maintains your bookmark folder structure
- **Real-time Updates**: New bookmarks are synced instantly
- **Search by Folder**: Filter bookmarks by folder name

### General Features
- **Beautiful UI**: Modern, responsive interface with gradient design
- **Statistics Dashboard**: View total visits, bookmarks, top domains, and folders
- **Quick Access**: Click any result to open in a new tab
- **Domain Icons**: Displays favicons for easy recognition

## Project Structure

```
history-retriever-app/
├── backend/               # Express + MongoDB backend
│   ├── config/           # Database configuration
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── server.js         # Main server file
├── frontend/             # React frontend
│   └── src/
│       ├── components/   # React components
│       ├── services/     # API service layer
│       └── App.jsx       # Main app component
└── chrome-extension/     # Chrome extension
    ├── background.js     # Service worker for history tracking
    ├── popup.html        # Extension popup UI
    ├── popup.js          # Popup functionality
    └── manifest.json     # Extension manifest
```

## Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (Community Edition)
- **Google Chrome** browser

## Installation & Setup

### 1. Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
brew services start mongodb-community
# OR
mongod
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd history-retriever-app/backend

# Install dependencies (already done)
# npm install

# Start the development server
npm run dev
```

The backend will run on **http://localhost:5000**

### 3. Setup Frontend

Open a new terminal:

```bash
# Navigate to frontend directory
cd history-retriever-app/frontend

# Install dependencies (already done)
# npm install

# Start the development server
npm run dev
```

The frontend will run on **http://localhost:5173**

### 4. Install Chrome Extension

#### Step 4.1: Add Extension Icons

Before loading the extension, you need to add icon files:

1. Go to `chrome-extension/icons/` directory
2. Add three PNG files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

**Quick way to create icons:**
- Use https://www.favicon-generator.org/
- Or any PNG image and resize at https://www.resizepixel.com/

#### Step 4.2: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to `history-retriever-app/chrome-extension` folder
5. Select the folder and click **Select Folder**

The extension will now:
- Automatically sync your last 30 days of browser history
- Sync ALL your Chrome bookmarks
- Track new page visits in real-time
- Track new bookmarks in real-time
- Send data to your local backend server

## Usage

The app has **3 main views** accessible via the navigation bar:

### 1. Instant Search (Main Feature!)

This is the **most powerful feature** - search across BOTH history and bookmarks instantly!

1. Open http://localhost:5173 in your browser
2. You'll see the Instant Search view (default)
3. **Just start typing** in the search box
4. Results appear **instantly** from both bookmarks and history
5. Use the tabs to filter:
   - **All Results**: Shows everything (bookmarks + history)
   - **Bookmarks**: Shows only bookmark matches
   - **History**: Shows only browser history matches

**Example searches:**
- Type "github" to find all GitHub pages you've visited or bookmarked
- Type "react" to find React-related bookmarks and browsing history
- Type any keyword to find related links from your past

### 2. Browser History View

Click "Browser History" in the navigation to see:
- **Statistics cards**: Total visits, top domains, and activity
- **Search bar**: Filter by URL, title, or domain
- **History list**: All your visited pages with:
  - Page title and URL (clickable)
  - Domain badge
  - Visit timestamp
  - Visit count (for repeat visits)
  - Delete option
- **Auto-refresh**: Updates every 10 seconds

### 3. Bookmarks View

Click "Bookmarks" in the navigation to see:
- **Statistics cards**: Total bookmarks, folders, and top domains
- **Filter bar**: Search by keyword or filter by folder
- **Bookmarks list**: All your bookmarks with:
  - Title and URL (clickable)
  - Folder badge (shows which folder it's in)
  - Domain badge
  - Date added
  - Delete option

### Chrome Extension Popup

Click the extension icon in Chrome to:
- View sync status (for both history and bookmarks)
- Manually trigger sync
- Open the dashboard
- Access extension settings

## API Endpoints

The backend provides these REST API endpoints:

### Browser History
- `GET /api/browser-history` - Get all browser history (with optional filters)
  - Query params: `query`, `domain`, `startDate`, `endDate`, `limit`
- `GET /api/browser-history/stats` - Get statistics
- `POST /api/browser-history` - Create/update single history entry
- `POST /api/browser-history/bulk` - Bulk create/update entries
- `DELETE /api/browser-history/:id` - Delete specific entry
- `DELETE /api/browser-history` - Delete all entries

### Bookmarks
- `GET /api/bookmarks` - Get all bookmarks (with optional filters)
  - Query params: `query`, `folder`, `domain`, `limit`
- `GET /api/bookmarks/stats` - Get bookmark statistics
- `GET /api/bookmarks/search?q=keyword` - Instant search bookmarks
- `GET /api/bookmarks/folders` - Get list of all bookmark folders
- `POST /api/bookmarks` - Create/update single bookmark
- `POST /api/bookmarks/bulk` - Bulk create/update bookmarks
- `DELETE /api/bookmarks/:id` - Delete specific bookmark
- `DELETE /api/bookmarks` - Delete all bookmarks

## How It Works

1. **Chrome Extension** uses Chrome's History and Bookmarks APIs to access your data
2. On installation:
   - Syncs last 30 days of browser history
   - Syncs ALL your bookmarks with folder structure
3. In real-time:
   - New page visits are sent to the backend immediately
   - New bookmarks are synced instantly
   - Bookmark changes are tracked and updated
4. **Backend** stores everything in MongoDB:
   - Deduplicates history (updates visit count for repeat visits)
   - Maintains bookmark folder organization
5. **Frontend** provides 3 views:
   - **Instant Search**: Search across everything simultaneously
   - **History View**: Browse and filter your browsing history
   - **Bookmarks View**: Manage your bookmarks by folder
6. Auto-refresh keeps data up-to-date

## Technologies Used

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Axios** - HTTP client
- **CSS3** - Styling with gradients and animations

### Extension
- **Chrome Extensions API** - History access
- **Chrome Storage API** - Extension state management
- **Service Workers** - Background processing

## Privacy & Security

- All data is stored **locally** on your machine
- No data is sent to external servers
- The backend runs on `localhost:5000`
- You have full control over your data (delete anytime)
- The extension only reads history, never modifies it

## Troubleshooting

### Backend won't start
- Make sure MongoDB is running
- Check if port 5000 is available
- Verify all npm packages are installed: `npm install`

### Frontend won't start
- Check if port 5173 is available
- Verify all npm packages are installed: `npm install`
- Clear browser cache and restart

### Extension not syncing
- Check if backend is running on http://localhost:5000
- Open extension popup to check sync status
- Try manual sync from the extension popup
- Check browser console for errors (F12)

### No data showing in dashboard
- Wait for initial sync to complete (check extension popup)
- Make sure you have browsing history in Chrome
- Check browser console for API errors
- Verify backend is running and accessible

## Future Enhancements

- Export history to CSV/JSON
- Advanced analytics and charts
- Time-based filtering (today, this week, etc.)
- Bookmark integration
- Full-text search across page content
- Dark mode
- User authentication for multi-device sync

## License

MIT License - Feel free to use and modify!

## Support

For issues or questions, please check the troubleshooting section above.

---

Made with MERN Stack + Chrome Extensions API
#   S m a r t - B o w s e r - A n d - B o o k m a r k - M a n a g e r  
 