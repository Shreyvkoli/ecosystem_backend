'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi, Message } from '@/lib/api'

interface EditorToDoListProps {
    orderId: string
    fileId: string
    onSeek: (seconds: number) => void
}

export default function EditorToDoList({ orderId, fileId, onSeek }: EditorToDoListProps) {
    const queryClient = useQueryClient()

    // Fetch with same key as Player to dedupe request
    const { data: messages } = useQuery({
        queryKey: ['messages', orderId, fileId],
        queryFn: async () => {
            const response = await messagesApi.listByFile(fileId)
            return response.data
        },
        enabled: !!fileId && !!orderId,
    })

    // Filter tasks
    const allTasks = messages || []
    const resolvedTasks = allTasks.filter(m => m.resolved)
    const pendingTasks = allTasks.filter(m => !m.resolved)

    const total = allTasks.length
    const completed = resolvedTasks.length
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

    const updateStatusMutation = useMutation({
        mutationFn: (data: { id: string, resolved: boolean }) =>
            messagesApi.update(data.id, { resolved: data.resolved }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', orderId] })
        }
    })

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const TaskItem = ({ task }: { task: Message }) => (
        <div className={`p-3 rounded-lg border ${task.resolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 shadow-sm'} transition-all`}>
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={task.resolved}
                    onChange={(e) => updateStatusMutation.mutate({ id: task.id, resolved: e.target.checked })}
                    className="mt-1.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded border-gray-300 cursor-pointer"
                />
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <span className={`text-sm ${task.resolved ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                            {task.content}
                        </span>
                        {task.timestamp !== null && (
                            <button
                                onClick={() => onSeek(task.timestamp!)}
                                className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium whitespace-nowrap ml-2"
                            >
                                Jump to {formatTime(task.timestamp!)}
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(task.createdAt).toLocaleString()} • {task.user?.name}
                    </p>
                </div>
            </div>
        </div>
    )

    if (!messages) return <div className="p-4 text-center text-gray-500">Loading tasks...</div>

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Pending Tasks
                </h3>
                <span className="text-xs font-semibold px-2 py-1 bg-white border border-gray-200 rounded text-gray-600">
                    {completed}/{total} Done
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100">
                <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
                {/* Pending List */}
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To Do ({pendingTasks.length})</h4>
                    {pendingTasks.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No pending tasks. Great job!</p>
                    ) : (
                        <div className="space-y-2">
                            {pendingTasks.map(task => <TaskItem key={task.id} task={task} />)}
                        </div>
                    )}
                </div>

                {/* Resolved List */}
                {resolvedTasks.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 gap-2">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Completed ({resolvedTasks.length})</h4>
                        <div className="space-y-2 opacity-75">
                            {resolvedTasks.map(task => <TaskItem key={task.id} task={task} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
