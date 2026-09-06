# Quick Start — 15 Minutes to Live

## Step 1: Get MongoDB (2 mins)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create cluster (free tier)
4. Click "Connect" → "Drivers" → copy connection string
5. Replace `<password>` with your password
6. Save it — you need this

**Example:**
```
mongodb+srv://bunny:mypassword123@cluster0.abc123.mongodb.net/team-recorder?retryWrites=true&w=majority
```

---

## Step 2: Get SendGrid API key (2 mins, optional)

1. Go to https://sendgrid.com
2. Sign up (free)
3. Create new API key
4. Verify sender email (yours or noreply@yourcompany.com)
5. Copy API key

**If you skip this:** emails won't send, but app works fine.

---

## Step 3: Deploy backend (5 mins)

Choose one:

### A. Railway (recommended)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → GitHub repo
4. Add environment variables:
   ```
   MONGO_URI=<from step 1>
   JWT_SECRET=mysecretkey123change
   SENDGRID_API_KEY=<from step 2>
   FROM_EMAIL=noreply@company.com
   PORT=5000
   ```
5. Deploy (auto)
6. Copy public URL (e.g., `https://team-recorder-xyz.railway.app`)

### B. Render

1. Go to https://render.com
2. Sign up with GitHub
3. New Web Service → connect repo
4. Build: `npm install`
5. Start: `node server.js`
6. Add same environment variables
7. Deploy
8. Copy public URL

---

## Step 4: Deploy frontend (3 mins)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Import this repo
4. Environment variable:
   ```
   REACT_APP_API_URL=<backend URL from step 3>
   ```
5. Deploy
6. Done! Get Vercel URL (e.g., `https://team-recorder.vercel.app`)

---

## Step 5: Share with team

Send them: `https://team-recorder.vercel.app`

Each person logs in with name + email. All records visible to everyone. Emails send when records created.

---

## Costs

- **MongoDB**: Free (forever)
- **Backend (Railway)**: Free tier includes $5/month credit, $7/mo after
- **Frontend (Vercel)**: Free
- **SendGrid**: Free tier = 100 emails/day, $15/mo for 10K/mo

**Total for your team**: Free to $15/month

---

## What just happened

✅ Records stored in MongoDB (survives forever)  
✅ API running on Railway/Render (auto-scales)  
✅ Frontend on Vercel (global CDN, fast)  
✅ Email notifications working  
✅ Export ready (CSV + JSON)  

---

## Next: Add your first record

1. Go to your app URL
2. Log in (name + email)
3. Click "+ New record"
4. Create → team gets email
5. Add comment → team gets notified
6. Export all → CSV downloads

---

## Troubleshooting

**Backend won't deploy**
- Check MONGO_URI is correct
- Make sure IP whitelist in MongoDB Atlas includes all IPs (0.0.0.0/0)

**Emails not sending**
- Check SENDGRID_API_KEY is valid
- Verify FROM_EMAIL is confirmed in SendGrid
- Look at backend logs

**Frontend won't connect**
- Check REACT_APP_API_URL matches backend URL exactly
- Make sure backend is running (`/health` endpoint works)

---

**That's it. You're live.**
