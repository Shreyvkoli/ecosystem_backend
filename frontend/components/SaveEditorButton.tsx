'use client'

import { useState } from 'react'
import { usersApi } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface SaveEditorButtonProps {
    editorId: string
}

export default function SaveEditorButton({ editorId }: SaveEditorButtonProps) {
    const queryClient = useQueryClient()

    // Check if saved
    const { data: savedEditors, isLoading } = useQuery({
        queryKey: ['saved-editors'],
        queryFn: async () => {
            try {
                const res = await usersApi.listSavedEditors()
                return res.data
            } catch (e) {
                return []
            }
        },
    })

    const isSaved = savedEditors?.some((e: any) => e.id === editorId)

    const saveMutation = useMutation({
        mutationFn: () => usersApi.saveEditor(editorId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['saved-editors'] })
            const action = data.data.saved ? 'Saved' : 'Removed'
            // alert(`${action} editor successfully`)
        },
        onError: (err: any) => {
            // alert(err.response?.data?.error || 'Failed to update saved editor')
        }
    })

    if (isLoading) return <div className="animate-pulse h-10 bg-gray-200 rounded"></div>

    return (
        <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={`w-full mb-3 flex items-center justify-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md transition-colors
                ${isSaved
                    ? 'border-indigo-500 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
        >
            <svg
                className={`w-4 h-4 mr-2 ${isSaved ? 'text-indigo-600 fill-indigo-600' : 'text-gray-400'}`}
                fill={isSaved ? 'currentColor' : 'none'}
                viewBox="0 0 20 20"
                stroke="currentColor"
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                />
            </svg>
            {saveMutation.isPending
                ? 'Updating...'
                : isSaved ? 'Saved to Favorites' : 'Save Editor for Future'
            }
        </button>
    )
}
