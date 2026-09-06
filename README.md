# Team Record Tracker

Shared workspace for cases, tasks, discussions, and decisions. Every team member has personal login. All records visible to everyone. Email notifications + export.

---

## Features

✅ **Team login** — each member logs in with name + email  
✅ **Shared records** — all records visible to everyone  
✅ **Record types** — case, task, discussion, decision  
✅ **Track ownership** — who created it, who handled it, date/time  
✅ **Follow-ups** — add comments with timestamps  
✅ **Email alerts** — notify team when new record created or updated  
✅ **Export** — download all records as CSV or single record as JSON  

---

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB (free Atlas tier)
- **Email**: SendGrid (free tier available)
- **Frontend**: React
- **Auth**: JWT tokens

---

## Setup (Local Dev)

### 1. Clone repo and install dependencies

```bash
npm install
```

### 2. Create `.env` file

Copy `.env.example` → `.env` and fill in:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/team-recorder
JWT_SECRET=your-secret-key-here-change-in-production
SENDGRID_API_KEY=SG.xxxxxxx
FROM_EMAIL=noreply@teamrecorder.app
PORT=5000
```

### 3. Get MongoDB Atlas URI

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free)
3. Create cluster → get connection string
4. Add to `.env` as `MONGO_URI`

Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/team-recorder?retryWrites=true&w=majority
```

### 4. Get SendGrid API key (optional but recommended)

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up (free tier = 100 emails/day)
3. Create API key → copy to `.env`
4. Set `FROM_EMAIL` to verified sender

**If no SendGrid key**: emails won't send, but app still works.

### 5. Run locally

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 6. Run React frontend

In another terminal:

```bash
npx create-react-app tracker
cd tracker
cp ../frontend.jsx src/App.jsx
echo "REACT_APP_API_URL=http://localhost:5000" > .env
npm start
```

Frontend runs on `http://localhost:3000`

---

## Deploy to Production

### Option A: Deploy Backend on Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect GitHub repo → auto-deploy
4. Add environment variables:
   - `MONGO_URI`
   - `JWT_SECRET` (use strong secret)
   - `SENDGRID_API_KEY`
   - `FROM_EMAIL`
   - `PORT=5000`
5. Get backend URL (e.g., `https://team-recorder.railway.app`)

### Option B: Deploy Backend on Render

1. Go to [render.com](https://render.com)
2. Create new Web Service → connect GitHub
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables (same as above)
6. Deploy → get URL

### Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Set `REACT_APP_API_URL` to your backend URL (e.g., `https://team-recorder.railway.app`)
4. Deploy

---

## Usage

### Login

1. Open app
2. Enter name + email
3. JWT token stored in localStorage
4. Team notified you joined

### Create Record

1. Click **+ New record**
2. Pick type (case/task/discussion/decision)
3. Fill title, description, who handled it, status
4. Create → **team gets email notification**

### Follow Up

1. Click any record
2. Add comment in "Follow-ups & updates" section
3. Comment timestamped + attributed to you
4. Team notified of updates

### Export

**All records** → button at top → downloads `records.csv`
- Includes: type, title, description, respondent, status, creator, date, comments

**Single record** → open record → "Export Record (JSON)"
- Downloads record details as JSON file

---

## API Endpoints

### Auth
- `POST /api/auth/login` — login with name + email, get JWT token

### Records
- `GET /api/records` — all records (requires token)
- `POST /api/records` — create record (requires token)
- `GET /api/records/:id` — single record (requires token)
- `POST /api/records/:id/comments` — add comment (requires token)

### Export
- `GET /api/records/export/csv` — all records as CSV (requires token)
- `GET /api/records/:id/export/json` — single record as JSON (requires token)

All requests need header: `Authorization: Bearer <token>`

---

## Email Notifications

**Sent when:**
1. New record created → all team members (except creator)
2. Comment added → record creator + team

**Email contains:**
- Record title + type
- Description
- Status + respondent
- Created by
- (for comments) Who said what + text

**If SendGrid not configured:** app still works, emails just don't send.

---

## Troubleshooting

**"MongoDB connection error"**
- Check `MONGO_URI` in `.env`
- Verify IP whitelist in MongoDB Atlas (set to 0.0.0.0/0 for dev)

**"Email not sending"**
- Verify `SENDGRID_API_KEY` is correct
- Check `FROM_EMAIL` is verified in SendGrid
- Look at server logs for errors

**"Token expired"**
- Expires after 30 days
- Frontend auto-stores in localStorage
- Log out + log in to refresh

**"Export file empty"**
- Make sure you're logged in + have records
- Check browser console for API errors

---

## Scaling

For 10+ records/day across your team:

1. **Database** — MongoDB free tier supports millions of records
2. **Backend** — Railway/Render free tier supports 1,000 requests/min
3. **Emails** — SendGrid free = 100/day, paid = $15/mo for 10K/mo

If hitting limits:
- Upgrade SendGrid ($15/mo)
- Upgrade Railway/Render ($7/mo)
- MongoDB Atlas free tier has no size limits

---

## Files

```
.
├── server.js           # Backend (Express + Mongoose)
├── frontend.jsx        # Frontend (React)
├── package.json        # Dependencies
├── .env.example        # Environment template
└── README.md           # This file
```

---

## Security Notes

- Change `JWT_SECRET` in production
- Use strong MongoDB password
- Enable SendGrid domain authentication
- Keep `.env` out of Git (add to `.gitignore`)
- Deploy on HTTPS only

---

## Support

Questions? Check:
- MongoDB Atlas docs: https://docs.atlas.mongodb.com
- SendGrid docs: https://docs.sendgrid.com
- Express docs: https://expressjs.com
- React docs: https://react.dev

---

**Built for your team. Deploy in 15 mins.**
