import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const creators = await prisma.user.findMany({
    where: { role: 'CREATOR' },
    include: { creatorProfile: true }
  });

  console.log(`Found ${creators.length} creators.`);
  creators.forEach(c => {
    console.log(`- ${c.name} (${c.email}) - Profile: ${c.creatorProfile ? 'YES' : 'NO'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
