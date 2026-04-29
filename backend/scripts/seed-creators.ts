import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding creators...');
  
  const creatorNames = [
    'Technical Guruji', 'CarryMinati', 'Flying Beast', 'Mumbiker Vlogs', 'MostlySane',
    'Bhuvan Bam', 'Ashish Chanchlani', 'Amit Bhadana', 'Sandip Maheshwari', 'Dr. Vivek Bindra',
    'Ranveer Allahbadia', 'Ankur Warikoo', 'Raj Shamani', 'Dhruv Rathee', 'Abhi and Niyu',
    'Physics Wallah', 'Khan Sir', 'Aman Dhattarwal', 'Triggered Insaan', 'Fukra Insaan',
    'Sourav Joshi Vlogs', 'Nishant Jindal', 'Ishan Sharma', 'Harkirat Singh', 'Striver',
    'Love Babbar', 'Apna College', 'CodeWithHarry', 'Telusko', 'Thapa Technical'
  ];

  const creators = [];

  for (let i = 0; i < creatorNames.length; i++) {
    const name = creatorNames[i];
    const email = `creator${i + 1}@example.com`;
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: hashedPassword,
        role: 'CREATOR',
        creatorProfile: {
          create: {
            bio: `Official account of ${name}. Looking for talented editors for my upcoming projects.`,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
          }
        }
      }
    });
    creators.push(user);
  }

  console.log(`Successfully seeded ${creators.length} creators with profiles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
