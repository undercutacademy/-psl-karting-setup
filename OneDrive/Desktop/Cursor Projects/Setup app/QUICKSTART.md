# Quick Start Guide

## Initial Setup (First Time Only)

### 1. Set Up Supabase (Cloud Database)

**No local PostgreSQL installation needed!**

1. Go to https://supabase.com and create a free account
2. Create a new project (takes 2-3 minutes)
3. Get your database connection string (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions)
4. Save your database password - you'll need it!

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your Supabase connection string
# Get the connection string from Supabase dashboard → Settings → Database
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public
```

Create `backend/.env` file:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
PORT=3001
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=lucasnogueira48@gmail.com
SMTP_PASS=Undercut@7748
MANAGER_EMAIL=undercutacademy@gmail.com
```

**Replace:**
- `[YOUR-PASSWORD]` with your Supabase database password
- `[PROJECT-REF]` with your Supabase project reference (found in dashboard URL)

Then run:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (creates tables in Supabase)
npx prisma migrate dev --name init

# Create manager user (uses MANAGER_EMAIL from .env)
npm run seed
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Running the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:3001

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

## First Use

1. **As Manager:**
   - Go to http://localhost:3000/manager/login
   - Login with the email you set in `MANAGER_EMAIL` in backend/.env
   - You should see the dashboard (empty initially)
   - **Bonus**: You can also view all data in Supabase dashboard at https://supabase.com

2. **As User/Driver:**
   - Go to http://localhost:3000/form
   - Enter your email
   - Fill out the form
   - Submit your first setup

## Viewing Data in Supabase Dashboard

1. Go to https://supabase.com
2. Select your project
2. Click **Table Editor** in left sidebar
3. View all submissions and users in a nice table format
4. Filter, search, and export data
5. Access from any device!

## Email Configuration

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASS` (not your regular password)

For other email providers, update SMTP settings accordingly.

## Troubleshooting

### Prisma Client Error
If you see `Module '@prisma/client' has no exported member 'PrismaClient'`:
```bash
cd backend
npx prisma generate
```

### Database Connection Error
- Check your DATABASE_URL in backend/.env
- Verify connection string format (see SUPABASE_SETUP.md)
- Make sure Supabase project is active
- Check Supabase dashboard → Settings → Database for correct connection string

### Email Not Sending
- Check SMTP credentials in backend/.env
- For Gmail, ensure you're using an App Password, not regular password
- Check backend console for error messages

### CORS Errors
- Ensure backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in frontend/.env.local matches backend URL

### Can't Connect to Supabase
- Verify project is fully initialized (wait 2-3 minutes after creation)
- Check connection string format
- Try using direct connection (not pooler) for initial setup

## Next Steps

- Customize email templates in `backend/src/services/emailService.ts`
- Adjust PDF formatting in `backend/src/services/pdfService.ts`
- Add more manager users via Supabase dashboard (Table Editor → User → Edit isManager field)
- Deploy to production (see README.md)

## Need Help?

- **Supabase Setup**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions
- **General Info**: See [README.md](./README.md)
