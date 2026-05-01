'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi, Message } from '@/lib/api'

interface EditorToDoListProps {
    orderId: string
    fileId: string
    onSeek: (seconds: number) => void
    onSwitchFile?: (id: string) => void
}

export default function EditorToDoList({ orderId, fileId, onSeek, onSwitchFile }: EditorToDoListProps) {
    const queryClient = useQueryClient()

    // Fetch with same key as Player to dedupe request
    // Fetch ALL messages for the order to ensure no pending tasks are missed
    const { data: allMessages } = useQuery({
        queryKey: ['messages', orderId, 'all'],
        queryFn: async () => {
            const response = await messagesApi.listByOrder(orderId)
            return response.data
        },
        enabled: !!orderId,
        refetchInterval: 5000,
    })

    // Filter only TIMESTAMP_COMMENT types as actionable tasks
    const taskMessages = messages.filter(m => m.type === 'TIMESTAMP_COMMENT')
    
    const currentFileTasks = taskMessages.filter(m => m.fileId === fileId)
    const otherFileTasks = taskMessages.filter(m => m.fileId && m.fileId !== fileId)
    
    const resolvedTasks = currentFileTasks.filter(m => m.resolved)
    const pendingTasks = currentFileTasks.filter(m => !m.resolved)
    
    const otherPendingTasks = otherFileTasks.filter(m => !m.resolved)

    const total = currentFileTasks.length
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
                    className="mt-1.5 h-4 w-4 text-brand focus:ring-brand rounded border-gray-300 cursor-pointer"
                />
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <span className={`text-sm ${task.resolved ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                            {task.content}
                        </span>
                        {task.timestamp !== null && (
                            <button
                                onClick={() => onSeek(task.timestamp!)}
                                className="text-xs px-2 py-0.5 bg-bg-brand/10 text-brand-dark rounded hover:bg-indigo-100 font-medium whitespace-nowrap ml-2"
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
                    <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div className="p-4 max-h-[500px] overflow-y-auto space-y-6">
                {/* Pending List for Current Version */}
                <div>
                    <h4 className="text-xs font-bold text-brand uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                        Current Version Tasks ({pendingTasks.length})
                    </h4>
                    {pendingTasks.length === 0 ? (
                        <div className="p-4 border-2 border-dashed border-gray-100 rounded-lg text-center">
                            <p className="text-sm text-gray-400 italic">No pending tasks for this version.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingTasks.map(task => <TaskItem key={task.id} task={task} />)}
                        </div>
                    )}
                </div>

                {/* Pending List for Other Versions */}
                {otherPendingTasks.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Tasks from Other Versions ({otherPendingTasks.length})
                        </h4>
                        <div className="space-y-3">
                            {otherPendingTasks.map(task => (
                                <div key={task.id} className="p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-sm text-gray-800 flex-1">{task.content}</p>
                                        <button 
                                            onClick={() => onSwitchFile?.(task.fileId!)}
                                            className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border border-orange-100"
                                        >
                                            Switch to {task.file?.type === 'RAW_VIDEO' ? 'Raw' : `v${task.file?.version || '?'}`}
                                        </button>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[10px] text-orange-400">
                                        <span>{task.file?.fileName || 'Unknown File'}</span>
                                        {task.timestamp !== null && (
                                            <span className="font-bold">@{formatTime(task.timestamp!)}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resolved List */}
                {resolvedTasks.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Completed ({resolvedTasks.length})</h4>
                        <div className="space-y-2">
                            {resolvedTasks.map(task => <TaskItem key={task.id} task={task} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
