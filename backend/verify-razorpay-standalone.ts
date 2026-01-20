
import dotenv from 'dotenv';
import path from 'path';
import Razorpay from 'razorpay';

// Manual env load simulation
const possiblePaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend', '.env')
];
console.log('Searching for .env in:', possiblePaths);

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_S5oluQBX9NzAaf";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "e06z4YkdIIAmPv5B2w1HpmUT";

console.log('Using Key ID:', KEY_ID);
console.log('Using Secret:', KEY_SECRET ? '***' : 'MISSING');

if (!KEY_ID || !KEY_SECRET) {
    console.error('Keys missing!');
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

async function verify() {
    try {
        console.log('Attempting to create dummy order...');
        const order = await razorpay.orders.create({
            amount: 50000,
            currency: 'INR',
            receipt: 'test_verify_' + Date.now()
        });
        console.log('SUCCESS! Order created:', order.id);
    } catch (error: any) {
        console.error('FAILED:', error.message || error);
    }
}

verify();
