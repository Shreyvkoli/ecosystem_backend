import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding specific creators c1-c20...');
  
  const password = '123456789';
  const hashedPassword = await bcrypt.hash(password, 10);

  const creators = [];

  for (let i = 1; i <= 20; i++) {
    const email = `c${i}@gmail.com`;
    const name = `Creator ${i}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'CREATOR',
        password: hashedPassword
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: 'CREATOR',
        creatorProfile: {
          create: {
            bio: `Official test account for ${name}. I am looking for pro editors.`,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
          }
        }
      }
    });

    // Ensure they have a profile if they already existed without one
    const profile = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      await prisma.creatorProfile.create({
        data: {
          userId: user.id,
          bio: `Official test account for ${name}. I am looking for pro editors.`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        }
      });
    }

    creators.push(user);
  }

  console.log(`Successfully seeded/updated ${creators.length} creators (c1-c20) with password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
