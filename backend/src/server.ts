import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
// Raised from the 100 KB default so submission POSTs can include a base64
// dash summary photo (capped at ~500 KB by the submissions route itself).
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Routes
import submissionsRouter from './routes/submissions';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import teamsRouter from './routes/teams';

app.use('/api/submissions', submissionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/teams', teamsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Graceful shutdown
async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
