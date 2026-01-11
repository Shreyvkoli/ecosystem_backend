import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('Creating test data...');

    // 1. Create Test Creator
    const creatorPassword = await bcrypt.hash('creator123', 10);
    const creator = await prisma.user.create({
      data: {
        email: 'creator@test.com',
        password: creatorPassword,
        name: 'Test Creator',
        role: 'CREATOR',
        walletBalance: 1000,
        creatorProfile: {
          create: {
            bio: 'I am a test content creator',
            avatarUrl: 'https://example.com/avatar1.jpg'
          }
        }
      }
    });

    // 2. Create Test Editor
    const editorPassword = await bcrypt.hash('editor123', 10);
    const editor = await prisma.user.create({
      data: {
        email: 'editor@test.com',
        password: editorPassword,
        name: 'Test Editor',
        role: 'EDITOR',
        walletBalance: 500,
        editorProfile: {
          create: {
            bio: 'I am a test video editor',
            avatarUrl: 'https://example.com/avatar2.jpg',
            rate: 50,
            skills: ['video editing', 'color grading', 'motion graphics'],
            portfolio: ['https://example.com/portfolio1.mp4', 'https://example.com/portfolio2.mp4'],
            available: true
          }
        }
      }
    });

    // 3. Create Test Order
    const order = await prisma.order.create({
      data: {
        title: 'Test Video Editing Order',
        description: 'I need a 5-minute video edited',
        brief: 'Raw footage needs basic editing, color correction, and background music',
        status: 'OPEN',
        amount: 100,
        creatorId: creator.id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    });

    // 4. Create Order Application
    const application = await prisma.orderApplication.create({
      data: {
        orderId: order.id,
        editorId: editor.id,
        status: 'APPLIED',
        depositAmount: 20,
        depositDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
    });

    // 5. Generate JWT Tokens
    const creatorToken = jwt.sign(
      { userId: creator.id, email: creator.email, role: creator.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    const editorToken = jwt.sign(
      { userId: editor.id, email: editor.email, role: editor.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    console.log('\n=== TEST DATA CREATED ===\n');
    console.log('CREATOR LOGIN:');
    console.log('Email:', creator.email);
    console.log('Password: creator123');
    console.log('JWT Token:', creatorToken);
    console.log('User ID:', creator.id);
    
    console.log('\nEDITOR LOGIN:');
    console.log('Email:', editor.email);
    console.log('Password: editor123');
    console.log('JWT Token:', editorToken);
    console.log('User ID:', editor.id);
    
    console.log('\nORDER DETAILS:');
    console.log('Order ID:', order.id);
    console.log('Title:', order.title);
    console.log('Status:', order.status);
    console.log('Creator ID:', creator.id);
    console.log('Editor ID:', editor.id);
    
    console.log('\nAPPLICATION:');
    console.log('Application ID:', application.id);
    console.log('Status:', application.status);
    console.log('Deposit Amount:', application.depositAmount);

    console.log('\n=== COPY-PASTE READY ===\n');
    console.log('Creator Login: creator@test.com / creator123');
    console.log('Editor Login: editor@test.com / editor123');
    console.log('Order ID:', order.id);
    console.log('Creator Token:', creatorToken);
    console.log('Editor Token:', editorToken);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
