# Supabase Setup Guide

This guide will walk you through setting up Supabase as your cloud database. No local PostgreSQL installation needed!

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if needed

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in the details:
   - **Name**: `PSL Karting Setup` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!) - Ce2cccb25d8d815d@48
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (perfect for your needs)
3. Click "Create new project"
4. Wait 2-3 minutes for project to initialize

## Step 3: Get Your Database Connection String

1. In your Supabase project dashboard, go to **Settings** (gear icon in left sidebar)
2. Click **Database** in the settings menu
3. Scroll down to **Connection string**
4. Under **Connection pooling**, select **Session mode**
5. Copy the connection string (it looks like):
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   
   **OR** use the **URI** format (recommended):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

6. Replace `[YOUR-PASSWORD]` with the database password you created in Step 2

## Step 4: Update Your Backend .env File

1. Open `backend/.env` (create it if it doesn't exist)
2. Add your Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
PORT=3001
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=lucasnogueira48@gmail.com
SMTP_PASS=Overcut@7748
MANAGER_EMAIL=pslkartingdata@gmail.com
```

**Important**: 
- Replace `[YOUR-PASSWORD]` with your actual database password
- Replace `[PROJECT-REF]` with your project reference (found in Supabase dashboard URL)
- Keep the `?schema=public` at the end

## Step 5: Run Database Migrations

Open terminal in your project root and run:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
```

This will:
- Generate Prisma client
- Create all tables in your Supabase database
- Set up the schema

## Step 6: Create Manager User

```bash
npm run seed
```

This creates a manager user with the email from `MANAGER_EMAIL` in your `.env` file.

## Step 7: Verify Setup

1. Go back to Supabase dashboard
2. Click **Table Editor** in the left sidebar
3. You should see:
   - `User` table
   - `Submission` table
4. Click on `User` table - you should see your manager user

## Step 8: Access Supabase Dashboard

You can now:
- **View all data** in the Table Editor
- **Query data** using SQL Editor
- **Manage users** and permissions
- **Access from any device** - just log into Supabase.com

## Using Supabase Dashboard

### View Submissions
1. Go to **Table Editor** → **Submission**
2. See all submissions in a table format
3. Filter, search, and sort

### View Users
1. Go to **Table Editor** → **User**
2. See all users
3. Edit `isManager` field to add more managers

### SQL Queries
1. Go to **SQL Editor**
2. Write custom queries:
   ```sql
   SELECT * FROM "Submission" 
   WHERE "track" = 'Orlando' 
   ORDER BY "createdAt" DESC;
   ```

## Security Notes

- Your database password is sensitive - don't commit `.env` to git
- Supabase provides automatic backups
- Free tier includes 500MB storage (plenty for 1000+ submissions)
- Free tier includes 2GB bandwidth/month

## Troubleshooting

### Connection Error
- Double-check your connection string format
- Make sure password doesn't have special characters that need URL encoding
- Verify project is active in Supabase dashboard

### Migration Fails
- Ensure connection string is correct
- Check Supabase project is fully initialized (wait a few minutes)
- Try using the direct connection string (not pooler) for migrations

### Can't See Tables
- Make sure migrations ran successfully
- Check Supabase dashboard → Table Editor
- Refresh the page

## Next Steps

Once setup is complete:
1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Test the form submission
4. View data in Supabase dashboard!

## Benefits of Supabase

✅ No local database installation  
✅ Access from any device via web dashboard  
✅ Automatic backups  
✅ Free tier covers your needs  
✅ Scales if you grow  
✅ Built-in security  

