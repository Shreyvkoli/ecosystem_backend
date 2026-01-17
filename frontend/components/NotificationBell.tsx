'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { notificationsApi, NotificationItem, User } from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface NotificationBellProps {
    user: User
}

export default function NotificationBell({ user }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!user) return

        // Fetch initial
        notificationsApi.list().then(res => {
            setNotifications(res.data.notifications)
            setUnreadCount(res.data.unreadCount)
        }).catch(console.error)

        // Socket listener
        const socket = connectSocket(user.id)
        const handleNewNotification = (notif: NotificationItem) => {
            setNotifications(prev => [notif, ...prev])
            setUnreadCount(prev => prev + 1)
            // Optional: Play sound?
        }

        socket.on('notification', handleNewNotification)

        return () => {
            socket.off('notification', handleNewNotification)
        }
    }, [user])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMarkRead = async (id: string) => {
        try {
            await notificationsApi.markRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error(err)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllRead()
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-x-2 top-16 sm:top-auto sm:inset-x-auto sm:absolute sm:right-0 sm:mt-2 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-50 ring-1 ring-black ring-opacity-5">
                    <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                        ) : (
                            notifications.map(notif => (
                                <Link
                                    key={notif.id}
                                    href={notif.link || '#'}
                                    className={`block p-3 border-b hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50' : ''}`}
                                    onClick={() => {
                                        if (!notif.isRead) handleMarkRead(notif.id)
                                        setIsOpen(false)
                                    }}
                                >
                                    <p className="text-sm font-medium text-gray-800 break-words">{notif.title}</p>
                                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
