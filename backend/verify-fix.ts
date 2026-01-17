
import { PrismaClient } from '@prisma/client';
import { createOrder } from './src/services/orderService';
import { getUserOrders } from './src/services/orderService';

const prisma = new PrismaClient();

async function main() {
    // 1. Find a creator
    const creator = await prisma.user.findFirst({
        where: { role: 'CREATOR' }
    });

    if (!creator) {
        console.log('No creator found.');
        return;
    }

    // 2. Create a "Verified Fix" order
    console.log('Creating "Verified Fix Order"...');
    const orderData = {
        title: "Verified Fix Order - Check This One",
        description: "This order was created AFTER the system update. It should show all details.",
        brief: "Brief verified.",
        amount: 7500,
        creatorId: creator.id,
        editingLevel: 'PREMIUM',
        rawFootageDuration: 45,
        expectedDuration: 10,
        referenceLink: "https://verified-link.com",
        deadline: new Date(Date.now() + 172800000).toISOString() // 48h
    };

    const newOrder = await createOrder(orderData);
    console.log('Created Order ID:', newOrder.id);

    // 3. Verify specifically what the API would return to an EDITOR
    // We need an editor ID to simulate the call
    const editor = await prisma.user.findFirst({
        where: { role: 'EDITOR' }
    });

    if (editor) {
        console.log(`\nSimulating API call for Editor: ${editor.email} (${editor.id})`);
        const editorOrders = await getUserOrders(editor.id, 'EDITOR');

        const targetOrder = editorOrders.find(o => o.id === newOrder.id);

        if (targetOrder) {
            console.log('--- API RESPONSE PREVIEW ---');
            console.log('Title:', targetOrder.title);
            console.log('Deadline:', targetOrder.deadline);
            console.log('Raw Footage:', targetOrder.rawFootageDuration);
            console.log('Expected Dur:', targetOrder.expectedDuration);
            console.log('Ref Link:', targetOrder.referenceLink);

            if (targetOrder.rawFootageDuration === 45 && targetOrder.referenceLink) {
                console.log('\n[PASS] The API is definitely returning the new fields.');
            } else {
                console.log('\n[FAIL] The API is missing fields!');
            }
        } else {
            console.log('New order not found in Editor list (Status might not be OPEN?)');
        }
    } else {
        console.log('No editor found to test API response.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
