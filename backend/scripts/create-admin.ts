
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    // 1. ADMIN
    const admin = await prisma.user.upsert({
        where: { email: 'admin@cutflow.com' },
        update: {},
        create: {
            email: 'admin@cutflow.com',
            password,
            name: 'Super Admin',
            role: 'ADMIN',
            walletBalance: 100000
        }
    });
    console.log('Admin Ready: admin@cutflow.com / password123');

    // 2. CREATOR
    await prisma.user.upsert({
        where: { email: 'creator@cutflow.com' },
        update: {},
        create: {
            email: 'creator@cutflow.com',
            password,
            name: 'Demo Creator',
            role: 'CREATOR',
            walletBalance: 50000,
            creatorProfile: {
                create: { bio: 'Demo Creator Bio', avatarUrl: 'https://placehold.co/150' }
            }
        }
    });
    console.log('Creator Ready: creator@cutflow.com / password123');

    // 3. EDITOR
    const editor = await prisma.user.upsert({
        where: { email: 'editor@cutflow.com' },
        update: {
            walletBalance: { increment: 1000 } // Ensure balance for withdrawal test
        },
        create: {
            email: 'editor@cutflow.com',
            password,
            name: 'Demo Editor',
            role: 'EDITOR',
            walletBalance: 6000,
            editorProfile: {
                create: {
                    bio: 'Demo Editor Bio',
                    avatarUrl: 'https://placehold.co/150',
                    rate: 500,
                    skills: 'editing,vfx',
                    portfolio: 'https://youtube.com',
                    available: true
                }
            }
        }
    });

    // Need to ensure profile exists if user existed but profile didn't (edge case)
    const profile = await prisma.editorProfile.findUnique({ where: { userId: editor.id } });
    if (!profile) {
        await prisma.editorProfile.create({
            data: {
                userId: editor.id,
                bio: 'Demo Editor Bio',
                avatarUrl: 'https://placehold.co/150',
                rate: 500,
                skills: 'editing,vfx',
                portfolio: 'https://youtube.com',
                available: true
            }
        })
    }

    console.log('Editor Ready: editor@cutflow.com / password123');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
