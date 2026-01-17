
'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { messagesApi, Message, User } from '@/lib/api'
import { connectSocket, joinOrderRoom } from '@/lib/socket'
import { formatDistanceToNow } from 'date-fns'

interface ChatRoomProps {
    orderId: string
    currentUser: User
    recipientName?: string
}

export default function ChatRoom({ orderId, currentUser, recipientName }: ChatRoomProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState('')
    // Ref for the SCROLLABLE CONTAINER, not an element at the bottom
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current
            scrollContainerRef.current.scrollTop = scrollHeight - clientHeight
        }
    }

    useEffect(() => {
        // Load initial messages
        messagesApi.listByOrder(orderId).then(res => {
            setMessages(res.data)
            // Scroll to bottom after state update
            setTimeout(scrollToBottom, 100)
        }).catch(err => console.error("Failed to load messages", err))

        // Socket listener
        const socket = connectSocket(currentUser.id)
        joinOrderRoom(orderId)

        const handleNewMessage = (msg: Message) => {
            setMessages(prev => {
                // Dedupe
                if (prev.find(m => m.id === msg.id)) return prev
                return [...prev, msg]
            })
            setTimeout(scrollToBottom, 50)
        }

        socket.on('chat_message', handleNewMessage)

        return () => {
            socket.off('chat_message', handleNewMessage)
        }
    }, [orderId, currentUser.id])

    const handleSend = async () => {
        if (!inputText.trim()) return

        const text = inputText
        setInputText('')

        try {
            await messagesApi.create({
                orderId,
                content: text
            })
            // Optimistic update handled by socket or refetch, but here we wait for socket usually.
        } catch (err) {
            console.error('Failed to send', err)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex flex-col h-[400px] w-full bg-white rounded-lg shadow-lg border-t-4 border-indigo-500 overflow-hidden">
            <div className="py-3 px-4 border-b bg-gray-50 flex flex-row items-center justify-between">
                <h3 className="text-sm font-bold flex items-center text-gray-700">
                    <MessageSquare size={16} className="mr-2 text-indigo-500" />
                    {recipientName ? `Chat with ${recipientName}` : 'Order Chat'}
                </h3>
            </div>
            {/* Added ref={scrollContainerRef} to the scrollable container */}
            <div ref={scrollContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-50/30 space-y-4">
                {messages.map((msg, index) => {
                    const isMe = msg.userId === currentUser.id
                    const isSystem = msg.type === 'SYSTEM'

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-2">
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                    {msg.content}
                                </span>
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm
                                ${isMe
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'}
                            `}>
                                <p>{msg.content}</p>
                                <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="p-3 border-t bg-gray-50 flex items-center space-x-2">
                <input
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md transition-colors shadow-sm">
                    <Send size={18} />
                </button>
            </div>
        </div>
    )
}
