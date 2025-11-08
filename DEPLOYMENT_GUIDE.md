# Deployment Guide - History Retriever App with AI Search

## 🚨 Important: Multi-User Considerations

**Current State:** Your app is designed for single-user local use.

**For Multi-User Deployment, you need:**
1. **User Authentication** - So each user sees only their own data
2. **Data Isolation** - Separate data per user in MongoDB
3. **API Key Management** - Each user should have their own Gemini API key OR you provide it centrally
4. **ChromaDB Scaling** - Persistent storage for vector embeddings

---

## Deployment Options

### Option 1: Quick Deploy (Free/Low Cost) ⭐ Recommended for Testing

**Frontend:** Vercel or Netlify (Free)
**Backend:** Render or Railway (Free tier)
**MongoDB:** MongoDB Atlas (Free tier)
**ChromaDB:** Self-hosted or Chroma Cloud

**Pros:**
- Free or very cheap
- Easy setup
- Good for demos/small projects

**Cons:**
- Limited resources on free tier
- ChromaDB needs separate hosting

---

### Option 2: Docker Deployment (Professional)

Deploy everything as containers on DigitalOcean, AWS, or Railway.

**Pros:**
- Complete control
- Easy scaling
- Reproducible deployments

**Cons:**
- More complex setup
- Costs ~$10-20/month

---

### Option 3: Serverless (Advanced)

**Frontend:** Vercel/Netlify
**Backend:** AWS Lambda or Vercel Serverless Functions
**MongoDB:** MongoDB Atlas
**ChromaDB:** Chroma Cloud or AWS

**Pros:**
- Scales automatically
- Pay per use

**Cons:**
- Complex setup
- Cold starts

---

## Step-by-Step: Option 1 (Recommended)

### Prerequisites

1. Create accounts on:
   - [Vercel](https://vercel.com) (Frontend)
   - [Render](https://render.com) (Backend)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Database)
   - [Chroma Cloud](https://www.trychroma.com/cloud) (Vector DB - optional)

---

### Step 1: Setup MongoDB Atlas (Free Database)

1. **Create Account**: Go to https://www.mongodb.com/cloud/atlas
2. **Create Cluster**:
   - Choose "Free" tier (M0)
   - Select a region close to you
3. **Create Database User**:
   - Database Access → Add New User
   - Username: `admin`, Password: (generate strong password)
4. **Whitelist IP**:
   - Network Access → Add IP Address
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
5. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy the connection string (looks like: `mongodb+srv://admin:password@cluster.mongodb.net/`)

**Save this connection string!**

---

### Step 2: Setup Chroma Cloud (Vector Database)

**Option A: Use Chroma Cloud (Recommended)**

1. Sign up at: https://www.trychroma.com/signup
2. Create a new database
3. Get your API key and endpoint URL
4. Save these for later

**Option B: Self-Host ChromaDB (Free but Complex)**

Deploy ChromaDB on Render or Railway using Docker:
- Use Docker image: `chromadb/chroma`
- Expose port 8000
- Add persistent volume for data

**Option C: Skip ChromaDB Initially (Test Mode)**

Deploy without semantic search first, add it later.

---

### Step 3: Deploy Backend to Render

1. **Push Code to GitHub**:
   ```bash
   cd C:\Users\rashi\history-retriever-app
   git init
   git add .
   git commit -m "Initial commit"

   # Create repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/history-retriever-app.git
   git push -u origin main
   ```

2. **Create Web Service on Render**:
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select `backend` folder as root directory

3. **Configure Build Settings**:
   ```
   Name: history-retriever-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.mongodb.net/history-retriever
   GOOGLE_API_KEY=your_gemini_api_key
   PORT=5000
   CHROMA_SERVER_URL=https://your-chroma-url.com (if using Chroma Cloud)
   ```

5. **Deploy**: Click "Create Web Service"

6. **Get Backend URL**: Copy your backend URL (e.g., `https://history-retriever-backend.onrender.com`)

---

### Step 4: Deploy Frontend to Vercel

1. **Update API URL in Frontend**:

   Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://history-retriever-backend.onrender.com/api
   ```

2. **Update Frontend Code**:

   Edit `frontend/src/components/SemanticSearch.jsx`:
   ```javascript
   const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   ```

3. **Deploy to Vercel**:
   ```bash
   cd frontend
   npm install -g vercel
   vercel login
   vercel
   ```

   Follow prompts:
   - Link to existing project? No
   - Project name: history-retriever
   - Directory: ./
   - Build command: npm run build
   - Output directory: dist

4. **Get Frontend URL**: Vercel will give you a URL like `https://history-retriever.vercel.app`

---

### Step 5: Update CORS in Backend

Add your Vercel URL to CORS whitelist in `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://history-retriever.vercel.app' // Add your Vercel URL
  ]
}));
```

Commit and push changes, Render will auto-deploy.

---

## Adding User Authentication

For multi-user support, you MUST add authentication. Here's a quick implementation:

### Install Auth Packages

```bash
cd backend
npm install jsonwebtoken bcryptjs
```

### Create User Model

`backend/models/User.js`:
```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
```

### Add userId to All Content Models

Update all models to include:
```javascript
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
```

### Protect Routes with Auth Middleware

`backend/middleware/auth.js`:
```javascript
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};
```

Apply to all routes:
```javascript
router.get('/', authenticateToken, async (req, res) => {
  // Only get current user's data
  const data = await Model.find({ userId: req.user.id });
  res.json(data);
});
```

---

## Docker Deployment (Alternative)

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chromadb_data:/chroma/chroma

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/history-retriever
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - CHROMA_SERVER_URL=http://chromadb:8000
    depends_on:
      - mongodb
      - chromadb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
  chromadb_data:
```

Deploy to any cloud provider that supports Docker (DigitalOcean, AWS, Railway).

---

## Cost Estimates

### Free Tier (Demo/Testing)
- MongoDB Atlas: Free (512MB)
- Render Backend: Free (sleeps after 15min inactivity)
- Vercel Frontend: Free (unlimited)
- Chroma Cloud: Free tier available
- **Total: $0/month**

### Hobby Tier (Small Production)
- MongoDB Atlas: Free or $9/month
- Render Backend: $7/month (always on)
- Vercel Frontend: Free
- Chroma Cloud: $20/month
- **Total: ~$27-36/month**

### Professional Tier
- MongoDB Atlas: $57/month (M10)
- DigitalOcean Droplet: $12/month (2GB RAM)
- Domain: $12/year
- **Total: ~$69/month**

---

## Security Checklist Before Going Live

- [ ] Add user authentication
- [ ] Validate all user inputs
- [ ] Use HTTPS only
- [ ] Secure API keys (environment variables)
- [ ] Add rate limiting
- [ ] Implement CORS properly
- [ ] Add data backup
- [ ] Monitor errors (Sentry)
- [ ] Add request logging
- [ ] Secure MongoDB (authentication, IP whitelist)

---

## Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash

echo "Building frontend..."
cd frontend
npm run build

echo "Deploying frontend to Vercel..."
vercel --prod

echo "Pushing backend to GitHub..."
cd ../backend
git add .
git commit -m "Deploy update"
git push

echo "Render will auto-deploy backend"
echo "Deployment complete!"
```

---

## Monitoring & Maintenance

**Free Tools:**
- [UptimeRobot](https://uptimerobot.com) - Monitor uptime
- [LogRocket](https://logrocket.com) - Session recording (free tier)
- [Sentry](https://sentry.io) - Error tracking (free tier)

**Add to backend:**
```bash
npm install @sentry/node
```

---

## Multi-User Chrome Extension

For the Chrome extension to work with multiple users:

1. **Add Login Screen** to extension popup
2. **Store JWT Token** in chrome.storage
3. **Send Token** with all API requests
4. **User-Specific Data** - Each user only sees their own history

---

## Next Steps

1. **Choose deployment option** (I recommend Option 1 for starters)
2. **Add authentication** (critical for multi-user)
3. **Deploy backend** to Render
4. **Deploy frontend** to Vercel
5. **Setup MongoDB Atlas**
6. **Test thoroughly**
7. **Share URL** with users!

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Chroma Cloud**: https://docs.trychroma.com/cloud

---

**Ready to deploy?** Start with MongoDB Atlas setup, then Render for backend, then Vercel for frontend!
