import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Routes
import submissionsRouter from './routes/submissions';
import usersRouter from './routes/users';
import authRouter from './routes/auth';

app.use('/api/submissions', submissionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Trigger restart 2
// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
