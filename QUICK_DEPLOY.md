# Quick Deployment Guide

## 🚀 Fastest Way to Deploy (Free)

### Step 1: Setup MongoDB Atlas (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster (M0 tier)
3. Create database user
4. Whitelist all IPs (0.0.0.0/0)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/history-retriever`

---

### Step 2: Deploy Backend to Render (10 minutes)

1. **Push to GitHub**:
   ```bash
   cd C:\Users\rashi\history-retriever-app
   git init
   git add .
   git commit -m "Initial deployment"

   # Create new repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/history-retriever-app.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables** (Add in Render dashboard):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/history-retriever
   GOOGLE_API_KEY=your_gemini_api_key_here
   PORT=5000
   ```

4. Click **"Create Web Service"**

5. **Copy your backend URL**: `https://your-app-name.onrender.com`

---

### Step 3: Deploy Frontend to Vercel (5 minutes)

1. **Update API URL**:

   Edit `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-app-name.onrender.com/api
   ```

2. **Update SemanticSearch Component**:

   Edit `frontend/src/components/SemanticSearch.jsx`:
   ```javascript
   const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   ```

   Also update in any other components that use `http://localhost:5000`

3. **Deploy**:
   ```bash
   cd frontend
   npx vercel
   ```

   Follow prompts:
   - Setup and deploy? Y
   - Which scope? (your account)
   - Link to existing project? N
   - Project name? history-retriever
   - Directory? ./
   - Override settings? N

4. **Production deployment**:
   ```bash
   npx vercel --prod
   ```

5. **Your app is live!** 🎉
   ```
   https://history-retriever.vercel.app
   ```

---

### Step 4: Update Backend CORS

Add your Vercel URL to CORS in `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://history-retriever.vercel.app',  // Add this
    'https://your-custom-domain.com'         // If you have one
  ]
}));
```

Commit and push - Render will auto-deploy.

---

## ⚠️ Important for Multi-User Access

**Your app currently does NOT have:**
- User authentication
- Data isolation between users
- User accounts

**This means:**
- All users will see the SAME data
- Anyone can delete anyone's data
- No privacy

**For production multi-user:**
Read `DEPLOYMENT_GUIDE.md` and implement authentication first!

---

## 🔄 Updating Your Deployed App

### Update Backend:
```bash
git add .
git commit -m "Update backend"
git push
```
Render will auto-deploy in ~2 minutes.

### Update Frontend:
```bash
cd frontend
git add .
git commit -m "Update frontend"
git push
npx vercel --prod
```

---

## 💰 Costs

**Free Tier:**
- MongoDB Atlas: Free (512MB)
- Render: Free (sleeps after 15min)
- Vercel: Free
- **Total: $0/month**

**Paid Tier (Always On):**
- MongoDB Atlas: Free
- Render: $7/month
- Vercel: Free
- **Total: $7/month**

---

## 🧪 Testing Your Deployment

1. Open your Vercel URL
2. Click "🧠 AI Search"
3. The page should load without errors
4. If you get API errors, check:
   - Backend is running on Render
   - Environment variables are set correctly
   - CORS is configured properly

---

## 📞 Support

**Backend not working?**
- Check Render logs
- Verify environment variables
- Check MongoDB connection

**Frontend not connecting?**
- Check `.env.production` has correct backend URL
- Check browser console for errors
- Verify CORS settings

---

## 🎯 Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string copied
- [ ] Backend deployed to Render
- [ ] Environment variables added on Render
- [ ] Backend URL copied
- [ ] Frontend `.env.production` updated
- [ ] Frontend deployed to Vercel
- [ ] CORS updated in backend
- [ ] Tested the live URL

**Estimated time: 20-30 minutes**

---

## Next Steps

1. **Add authentication** (see DEPLOYMENT_GUIDE.md)
2. **Setup custom domain** (optional)
3. **Monitor with UptimeRobot** (free)
4. **Add error tracking** (Sentry - free tier)

**Your URL to share:** `https://your-app.vercel.app` 🚀
