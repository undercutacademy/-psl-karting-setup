import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Simple password hashing (matches auth.ts)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  // Get manager credentials from environment or use defaults
  const managerEmail = process.env.MANAGER_EMAIL || 'manager@example.com';
  const managerPassword = process.env.MANAGER_PASSWORD || 'pslkarting2024';

  const hashedPassword = hashPassword(managerPassword);

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {
      isManager: true,
      password: hashedPassword,
    },
    create: {
      email: managerEmail,
      firstName: 'Manager',
      lastName: 'User',
      password: hashedPassword,
      isManager: true,
    },
  });

  console.log('Manager user created/updated:', {
    id: manager.id,
    email: manager.email,
    firstName: manager.firstName,
    lastName: manager.lastName,
    isManager: manager.isManager,
  });
  console.log('\n=== Manager Login Credentials ===');
  console.log(`Email: ${managerEmail}`);
  console.log(`Password: ${managerPassword}`);
  console.log('=================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
