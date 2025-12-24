# Quick Setup Summary

## What You Need to Do

### 1. Create Supabase Account (5 minutes)
- Go to https://supabase.com
- Sign up (free)
- Create new project
- Save your database password

### 2. Get Connection String (2 minutes)
- In Supabase dashboard: Settings → Database
- Copy connection string
- Replace `[YOUR-PASSWORD]` with your actual password

### 3. Configure Backend (2 minutes)
- Create `backend/.env` file
- Paste your Supabase connection string
- Add your email settings (already in QUICKSTART.md)

### 4. Run Setup Commands (3 minutes)
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### 5. Start the App
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

## That's It!

- **Form**: http://localhost:3000/form
- **Manager Dashboard**: http://localhost:3000/manager/login
- **Supabase Dashboard**: https://supabase.com (view all data)

## Need Detailed Instructions?

- **Supabase Setup**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Full Guide**: See [QUICKSTART.md](./QUICKSTART.md)

