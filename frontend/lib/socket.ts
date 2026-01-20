
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket: Socket | null = null;
// Use API URL base for socket, or fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ecosystem-backend-1.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');


export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: false // Connect manually when needed (after login)
        });
    }
    return socket;
};

export const connectSocket = (userId?: string) => {
    const s = getSocket();

    if (!s.connected) {
        s.connect();
    }

    if (userId) {
        // If already connected, join immediately
        if (s.connected) {
            s.emit('join_user', userId);
        }

        // Ensure we join on connect (initial or reconnect)
        // We remove previous listener to avoid duplicates if called multiple times, 
        // though typically this function is called once per effect.
        s.off('connect').on('connect', () => {
            s.emit('join_user', userId);
        });
    }

    return s;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinOrderRoom = (orderId: string) => {
    const s = getSocket();
    if (s.connected) {
        s.emit('join_order', orderId);
    }
};
