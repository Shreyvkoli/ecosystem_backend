import { PrismaClient, LedgerEntry } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export enum AccountType {
    CREATOR_WALLET = 'CREATOR_WALLET_',
    EDITOR_WALLET = 'EDITOR_WALLET_',
    ESCROW_HOLDING = 'ESCROW_HOLDING_',
    PLATFORM_REVENUE = 'PLATFORM_REVENUE',
    GATEWAY_EXTERNAL = 'GATEWAY_EXTERNAL'
}

export class LedgerService {
    /**
     * Executes a strict double-entry accounting transaction.
     * Records the origin and destination of funds immutably.
     */
    static async transfer(data: {
        from: string;
        to: string;
        amount: number;
        currency?: string;
        transactionType: string;
        orderId?: string;
        idempotencyKey?: string;
        prismaTx?: any; // To allow chaining within existing transactions
    }): Promise<LedgerEntry> {

        const txClient = data.prismaTx || prisma;

        // Ensure amount is strictly positive
        if (data.amount <= 0) throw new Error("Transaction amount must be strictly positive");

        // Hash to prevent identical simultaneous transactions
        const txHash = crypto.createHash('sha256')
            .update(`${data.idempotencyKey || Date.now()}-${data.from}-${data.to}-${data.amount}-${data.transactionType}`)
            .digest('hex');

        // Create immutable ledger entry
        const entry = await txClient.ledgerEntry.create({
            data: {
                accountFrom: data.from,
                accountTo: data.to,
                amount: data.amount,
                currency: data.currency || 'INR',
                transactionType: data.transactionType,
                orderId: data.orderId,
                txHash
            }
        });

        // Optionally, update quick-access user wallet balances if applicable
        if (data.to.startsWith(AccountType.CREATOR_WALLET) || data.to.startsWith(AccountType.EDITOR_WALLET)) {
            const userId = data.to.split('_').pop();
            if (userId) {
                await txClient.user.update({
                    where: { id: userId },
                    data: { walletBalance: { increment: data.amount } }
                });

                // Create WalletTransaction record
                await (txClient as any).walletTransaction.create({
                    data: {
                        userId,
                        orderId: data.orderId,
                        amount: data.amount,
                        type: data.transactionType,
                        isCleared: data.transactionType === 'REFUND' || data.transactionType === 'DEPOSIT_REFUND', // Refunds are cleared immediately
                        clearedAt: (data.transactionType === 'REFUND' || data.transactionType === 'DEPOSIT_REFUND') ? new Date() : null
                    }
                });
            }
        }

        if (data.from.startsWith(AccountType.CREATOR_WALLET) || data.from.startsWith(AccountType.EDITOR_WALLET)) {
            const userId = data.from.split('_').pop();
            if (userId) {
                const user = await txClient.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
                if (user && user.walletBalance < data.amount) {
                    // Floor at 0 for editors to prevent negative debt, but still record transaction
                    // In a more strict system, we might throw an error, but here we floor it.
                    await txClient.user.update({
                        where: { id: userId },
                        data: { walletBalance: 0 }
                    });
                } else {
                    await txClient.user.update({
                        where: { id: userId },
                        data: { walletBalance: { decrement: data.amount } }
                    });
                }
            }
        }

        return entry;
    }
}
