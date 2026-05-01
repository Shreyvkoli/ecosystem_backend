'use client'

import { useState } from 'react'
import { filesApi, messagesApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'

interface LinkSubmissionProps {
    orderId: string
    fileType: 'PREVIEW_VIDEO' | 'FINAL_VIDEO' | 'RAW_VIDEO'
    onSuccess: () => void
}

export default function LinkSubmission({ orderId, fileType, onSuccess }: LinkSubmissionProps) {
    const [link, setLink] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Check for unresolved tasks before allowing submission
    const { data: messages } = useQuery({
        queryKey: ['messages', orderId, 'all'],
        queryFn: async () => {
            const response = await messagesApi.listByOrder(orderId)
            return response.data
        },
        enabled: !!orderId,
        refetchInterval: 3000, // Poll more frequently for submission sync
    })

    const pendingTasks = messages?.filter(m => m.type === 'TIMESTAMP_COMMENT' && !m.resolved) || []
    const hasPendingTasks = pendingTasks.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!link) return

        // Detect Provider
        const isDrive = link.includes('drive.google.com')
        const isDropbox = link.includes('dropbox.com')
        const isYouTube = link.includes('youtube.com') || link.includes('youtu.be')
        const isDirect = link.match(/\.(mp4|mov|avi|mkv)$/i) || link.includes('storage.googleapis.com');

        // Allow any valid URL for testing, but categorize best we can
        let provider = 'OTHER'
        if (isDrive) provider = 'GOOGLE_DRIVE'
        else if (isDropbox) provider = 'DROPBOX'
        else if (isYouTube) provider = 'YOUTUBE'
        else if (isDirect) provider = 'DirectLink'

        // Removed strict validation to allow testing with generic URLs
        // if (!isDrive && !isDropbox) ...

        setLoading(true)
        setError(null)

        try {
            let externalId = undefined;
            const driveMatch = link.match(/[-\w]{25,}/);
            if (isDrive && driveMatch) {
                externalId = driveMatch[0];
            } else if (isYouTube) {
                // Try extract YT ID
                const ytMatch = link.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
                if (ytMatch) externalId = ytMatch[1];
            }

            await filesApi.register({
                orderId,
                fileName: fileType === 'PREVIEW_VIDEO' ? 'Preview Video (Link)' : 'Final Video (Link)',
                type: fileType,
                provider: provider as any,
                publicLink: link,
                externalFileId: externalId
            })

            setLink('')
            onSuccess()
        } catch (err: any) {
            console.error(err)
            setError(err?.response?.data?.error || 'Failed to submit link')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {fileType === 'PREVIEW_VIDEO' ? 'Paste Preview Link (Watermarked)' : 'Paste Final Delivery Link (Clean)'}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://drive.google.com/file/d/..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Ensure Link Sharing is set to "Anyone with the link".
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                {hasPendingTasks && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-yellow-800 uppercase">Pending Tasks</p>
                            <p className="text-xs text-yellow-700">
                                You have {pendingTasks.length} unresolved comment{pendingTasks.length > 1 ? 's' : ''}. 
                                Please complete all tasks in the to-do list before submitting.
                            </p>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !link || hasPendingTasks}
                    className="w-full px-4 py-2 bg-brand text-white font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Submitting...' : hasPendingTasks ? 'Resolve Tasks to Submit' : 'Submit Link'}
                </button>
            </form>
        </div>
    )
}
