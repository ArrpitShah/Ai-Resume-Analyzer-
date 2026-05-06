# RemCheck — Deployment Guide

## Step 1: GitHub pe push karo

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/remcheck.git
git push -u origin main
```

---

## Step 2: Railway (Backend)

1. railway.app → Login with GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Backend folder select karo
4. Environment Variables add karo:

```
NODE_ENV          = production
SUPABASE_URL      = https://xxx.supabase.co
SUPABASE_SERVICE_KEY = eyJ...
ANTHROPIC_API_KEY = sk-ant-...
GEMINI_API_KEY    = AIza...
ALLOWED_ORIGINS   = https://your-app.netlify.app
PASSWORD_RESET_URL= https://your-app.netlify.app/reset-password
```

5. Deploy hone ke baad Railway URL copy karo:
   `https://remcheck-backend.railway.app`

---

## Step 3: Netlify (Frontend)

1. netlify.com → Login with GitHub
2. "Add new site" → "Import from GitHub"
3. Settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

4. Environment Variables add karo:

```
VITE_API_URL          = https://remcheck-backend.railway.app
VITE_SUPABASE_URL     = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY= eyJ...
```

5. Deploy karo

---

## Step 4: Supabase Update karo

Authentication → URL Configuration:
```
Site URL: https://your-app.netlify.app
Redirect URLs:
  https://your-app.netlify.app/dashboard
  https://your-app.netlify.app/reset-password
```

---

## Step 5: Frontend mein localhost replace karo

Saari files mein `http://localhost:5000` ko replace karo:

```js

axios.get("http://localhost:5000/api/resume/user/123")

import api from "../services/axiosInstance"
api.get("/api/resume/user/123")
```

Files jahan localhost hai:
- ResumeUpload.jsx
- JDMatch.jsx
- Overview.jsx
- AllAnalyses.jsx
- AnalysisDetail.jsx
- Settings.jsx

---

## Checklist

- [ ] GitHub pe code push kiya
- [ ] Railway backend deploy kiya
- [ ] Railway environment variables set kiye
- [ ] Netlify frontend deploy kiya
- [ ] Netlify environment variables set kiye
- [ ] Supabase redirect URLs update kiye
- [ ] localhost:5000 → Railway URL replace kiya
- [ ] Test kiya — login, upload, JD match