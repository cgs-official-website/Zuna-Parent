import readline from 'readline';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function createAdmin() {
  console.log('==============================================');
  console.log('  Zuna Central Admin — Bootstrap Super Admin  ');
  console.log('==============================================\n');

  try {
    let name = await askQuestion('Enter Admin Name (default: Super Admin): ');
    if (!name) name = 'Super Admin';

    let email = await askQuestion('Enter Admin Email (default: admin@zuna.com): ');
    if (!email) email = 'admin@zuna.com';
    email = email.toLowerCase().trim();

    let password = await askQuestion('Enter Admin Password (min 6 chars, default: Cgs@001a): ');
    if (!password) password = 'Cgs@001a';

    if (password.length < 6) {
      console.error('\n❌ Error: Password must be at least 6 characters.');
      process.exit(1);
    }

    console.log(`\nChecking if admin ${email} already exists...`);
    const existing = await prisma.admin.findUnique({
      where: { email }
    });

    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      console.log(`Admin ${email} already exists. Updating credentials...`);
      const updated = await prisma.admin.update({
        where: { id: existing.id },
        data: {
          name,
          passwordHash,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log(`\n✅ Successfully updated Super Admin: ${updated.email} (ID: ${updated.id})`);
    } else {
      console.log('Creating new Super Admin record in PostgreSQL...');
      const created = await prisma.admin.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log(`\n✅ Successfully created Super Admin: ${created.email} (ID: ${created.id})`);
    }

    console.log('\nYou can now log in using these credentials at /api/auth/login');
  } catch (error) {
    console.error('\n❌ Error bootstrapping admin:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

createAdmin();
