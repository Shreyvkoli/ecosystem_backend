import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReputationService {
    /**
     * Updates reliability score based on performance events.
     * Scale: 0 (Banned) to 100 (Trusted Elite)
     */
    static async updateScore(userId: string, delta: number, reason: string): Promise<number> {
        const user = await (prisma.user as any).findUnique({ where: { id: userId } });
        if (!user) return 0;

        let newScore = (user.reliabilityScore || 100) + delta;
        newScore = Math.max(0, Math.min(100, newScore));

        await (prisma.user as any).update({
            where: { id: userId },
            data: { reliabilityScore: newScore }
        });

        console.log(`[ReputationService] User ${userId} score updated to ${newScore} (Reason: ${reason})`);

        // Auto-lock accounts that fall below a critical threshold
        if (newScore < 20) {
            console.warn(`[ReputationService] CRITICAL: User ${userId} flagged for poor reliability.`);
            // TODO: In production, trigger a shadow-ban or human review
        }

        return newScore;
    }

    /**
     * Logic for On-Time Delivery vs. Missed Deadline
     */
    static async handleOrderCompletion(userId: string, onTime: boolean) {
        const delta = onTime ? 2 : -15; // Missed deadlines are severely penalized
        await this.updateScore(userId, delta, onTime ? 'ON_TIME_DELIVERY' : 'MISSED_DEADLINE');
    }

    /**
     * Logic for Verified Abuse (Admin action)
     */
    static async handleMaliciousAct(userId: string) {
        await this.updateScore(userId, -50, 'VERIFIED_ABUSE_REPORT');
    }
}
