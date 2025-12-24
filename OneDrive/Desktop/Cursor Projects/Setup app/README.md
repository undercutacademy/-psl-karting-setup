# PSL Karting Setup Management App

A custom web application for managing karting race setups, built with Next.js and Express.

## Project Structure

```
setup-app/
├── frontend/          # Next.js application
├── backend/           # Express API server
└── README.md
```

## Features

### User Features
- Multi-step form for submitting karting setups
- Email-based identification (no password required)
- Automatic prefilling of previous setup
- "Has setup changed?" flow for quick submissions
- All fields from original JotForm included
- Progress indicator
- Responsive design

### Manager Features
- Email-based authentication
- Dashboard with table view of all submissions
- Search and filter functionality (by driver, track, session type)
- View individual submission details
- Edit submissions
- Export submissions as PDF
- Email notifications on new submissions

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account (free) - cloud database, no installation needed
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

### Backend Setup

1. **Set up Supabase (Cloud Database)**
   - Go to https://supabase.com and create a free account
   - Create a new project
   - Get your database connection string from Settings → Database
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions

2. **Configure environment variables in `backend/.env`**:
   ```
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
   PORT=3001
   NODE_ENV=development
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   MANAGER_EMAIL=manager@example.com
   ```
   Replace `[PASSWORD]` and `[PROJECT-REF]` with your Supabase credentials

3. **Generate Prisma client and run migrations**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed manager user**:
   ```bash
   npm run seed
   ```
   (Make sure MANAGER_EMAIL in .env matches the email you want to use as manager)

5. **Start the backend server**:
   ```bash
   npm run dev
   ```

Backend will run on http://localhost:3001

### Environment Variables

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public
PORT=3001
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MANAGER_EMAIL=manager@example.com
```
Replace `[PASSWORD]` and `[PROJECT-REF]` with your Supabase credentials

## Usage

### For Drivers/Users
1. Navigate to http://localhost:3000/form
2. Enter your email address
3. If you have a previous setup, choose whether it changed
4. Fill out the form (or update only changed fields)
5. Submit and receive email confirmation

### For Managers
1. Navigate to http://localhost:3000/manager/login
2. Login with your manager email (must be set in database with isManager=true)
3. View all submissions in the dashboard
4. Search, filter, view, edit, or export PDFs

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL in the cloud) with Prisma ORM
- **Email**: Nodemailer
- **PDF**: PDFKit

## API Endpoints

### Submissions
- `GET /api/submissions` - Get all submissions
- `GET /api/submissions/:id` - Get submission by ID
- `GET /api/submissions/last/:email` - Get last submission by email
- `GET /api/submissions/:id/pdf` - Export submission as PDF
- `POST /api/submissions` - Create new submission
- `PUT /api/submissions/:id` - Update submission

### Users
- `GET /api/users/email/:email` - Get user by email

### Auth
- `POST /api/auth/manager/login` - Manager login
- `GET /api/auth/manager/check/:email` - Check if email is manager

## Database Schema

### User
- id (UUID)
- email (unique)
- firstName
- lastName
- isManager (boolean)
- createdAt, updatedAt

### Submission
- All setup fields (sessionType, classCode, track, championship, division, engine setup, tyres, kart setup, lapTime, observation)
- userId (foreign key)
- createdAt, updatedAt

## Development

### Running in Development
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

### Database Management
```bash
# Generate Prisma client
cd backend
npx prisma generate

# Create migration
npx prisma migrate dev

# Open Prisma Studio (local database GUI)
npx prisma studio

# Or use Supabase Dashboard (recommended)
# Go to https://supabase.com → Your Project → Table Editor
```

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL` to your backend URL
4. Deploy

### Backend (Railway/Render)
1. Push code to GitHub
2. Create new service on Railway/Render
3. Set all environment variables (including Supabase DATABASE_URL)
4. Deploy

**Note**: Since you're using Supabase, you don't need to provision a separate database on Railway/Render - just use your Supabase connection string!

## Notes

- Email service requires SMTP configuration (Gmail, SendGrid, etc.)
- Manager users must have `isManager: true` in the database
- PDF export generates downloadable PDF files
- All form fields match the original JotForm structure
