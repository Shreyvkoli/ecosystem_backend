import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const creatorCount = await prisma.user.count({
    where: { role: 'CREATOR' }
  });
  
  const creatorProfileCount = await prisma.creatorProfile.count();

  console.log('Creators in DB:', creatorCount);
  console.log('Creator Profiles in DB:', creatorProfileCount);

  const sampleCreators = await prisma.user.findMany({
    where: { role: 'CREATOR' },
    take: 5,
    include: { creatorProfile: true }
  });

  console.log('Sample Creators:', JSON.stringify(sampleCreators, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
