
import { PrismaClient, Notification } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

export class NotificationService {
    private static instance: NotificationService;
    private io: Server | null = null;

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public setIo(io: Server) {
        this.io = io;
    }

    /**
     * Create a notification and emit via Socket.IO
     */
    public async createAndSend(data: {
        userId: string;
        type: string; // SYSTEM, ORDER, COMMENT, CHAT
        title: string;
        message: string;
        link?: string;
    }): Promise<Notification> {
        const idempotencyKey = crypto.randomUUID();

        // Save to DB
        const notification = await (prisma.notification as any).create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                idempotencyKey
            }
        });

        // Emit real-time event with stability metadata
        if (this.io) {
            this.io.to(data.userId).emit('notification', {
                ...notification,
                eventId: idempotencyKey // Redundant for frontend convenience
            });
        }

        return notification;
    }

    /**
     * Broadcast order update to multiple users (e.g. chat message)
     */
    public async sendOrderEvent(orderId: string, event: string, payload: any) {
        if (this.io) {
            const enrichedPayload = {
                ...payload,
                eventId: crypto.randomUUID(),
                emittedAt: new Date().toISOString()
            };
            this.io.to(`order:${orderId}`).emit(event, enrichedPayload);
        }
    }
    /**
     * Emit a notification via Socket.IO without creating a DB record
     * (Useful when the record is created inside a transaction)
     */
    public notifyUser(userId: string, notification: Notification) {
        if (this.io) {
            this.io.to(userId).emit('notification', notification);
        }
    }
}

