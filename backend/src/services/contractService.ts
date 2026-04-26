
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ContractService {
    static async generateForOrder(orderId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                creator: { select: { name: true, email: true } },
                editor: { select: { id: true, name: true, email: true } }
            }
        });

        if (!order || !order.editor) return null;

        const contractText = `
SERVICE AGREEMENT (WORK-FOR-HIRE)
---------------------------------
Order ID: ${order.id}
Date: ${new Date().toLocaleDateString()}

PARTIES:
1. Creator: ${order.creator.name} (${order.creator.email})
2. Editor: ${order.editor.name} (${order.editor.email})

SCOPE OF WORK:
Project Title: ${order.title}
Amount: ${order.currency} ${order.amount || 0}
Deadline: ${order.deadline?.toLocaleDateString() || 'N/A'}

TERMS:
- The Editor agrees to deliver the edited video as per the brief.
- This is a Work-for-Hire agreement. All Intellectual Property (IP) rights transfer to the Creator upon full payment.
- The Platform (Ecosystem) holds the fee in Escrow and will redistribute Editor Stake in case of ghosting as per Platform Policy.

DIGITALLY SIGNED VIA ECOSYSTEM PLATFORM.
TIMESTAMP: ${new Date().toISOString()}
        `.trim();

        // For MVP, we'll just store the text or a link. 
        // We'll simulate a "URL" by using a data URI or just a placeholder.
        const contractUrl = `https://ecosystem.platform/contracts/${order.id}`;

        await prisma.order.update({
            where: { id: orderId },
            data: { digitalContractUrl: contractUrl }
        });

        return { contractUrl, contractText };
    }
}
