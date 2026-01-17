
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

        // Save to DB
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link
            }
        });

        // Emit real-time event
        if (this.io) {
            this.io.to(data.userId).emit('notification', notification);
        }

        return notification;
    }

    /**
     * Broadcast order update to multiple users (e.g. chat message)
     */
    public async sendOrderEvent(orderId: string, event: string, payload: any) {
        if (this.io) {
            this.io.to(`order:${orderId}`).emit(event, payload);
        }
    }
}
