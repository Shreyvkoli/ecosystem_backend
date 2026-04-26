
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456789', 10);
  const categories = ['Gaming', 'Vlog', 'Short-form', 'Podcast', 'Documentary', 'Corporate'];

  const firstNames = ['Aarav', 'Vihaan', 'Ishaan', 'Saanvi', 'Ananya', 'Diya', 'Advait', 'Arjun', 'Kabir', 'Myra', 'Aditi', 'Rohan', 'Sneha', 'Aryan', 'Ishita', 'Rahul', 'Priya', 'Vikram', 'Anjali', 'Kunal', 'Meera', 'Yash', 'Tanvi', 'Neil', 'Riya', 'Sameer', 'Shreya', 'Dev', 'Kavya', 'Akash'];
  const lastNames = ['Sharma', 'Gupta', 'Patel', 'Singh', 'Malhotra', 'Iyer', 'Reddy', 'Chopra', 'Verma', 'Kumar', 'Kapoor', 'Mehta', 'Joshi', 'Dubey', 'Trivedi', 'Bose', 'Das', 'Chatterjee', 'Nair', 'Menon'];

  console.log('Seeding 100 editors with Indian names...');

  for (let i = 1; i <= 100; i++) {
    const email = `e${i}@gmail.com`;
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${randomFirstName} ${randomLastName}`;
    
    // Pick 1-3 random skills from the categories
    const shuffled = [...categories].sort(() => 0.5 - Math.random());
    const selectedSkills = shuffled.slice(0, Math.round(Math.random() * 2) + 1);
    
    await prisma.user.upsert({
      where: { email },
      update: {
        password,
        role: 'EDITOR',
        name, // Update name
      },
      create: {
        email,
        password,
        name,
        role: 'EDITOR',
        walletBalance: 0,
        editorProfile: {
          create: {
            bio: `Namaste! I am ${name}, a professional video editor specializing in ${selectedSkills.join(', ')}.`,
            avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
            rate: Math.floor(Math.random() * 1000) + 500,
            skills: selectedSkills.join(','),
            portfolio: 'https://youtube.com',
            available: true,
          }
        }
      }
    });

    if (i % 10 === 0) {
      console.log(`Updated/Created ${i} editors...`);
    }
  }

  console.log('Successfully seeded 100 editors!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
