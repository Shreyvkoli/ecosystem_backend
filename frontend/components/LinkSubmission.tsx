'use client'

import { useState } from 'react'
import { filesApi } from '@/lib/api'

interface LinkSubmissionProps {
    orderId: string
    fileType: 'PREVIEW_VIDEO' | 'FINAL_VIDEO' | 'RAW_VIDEO'
    onSuccess: () => void
}

export default function LinkSubmission({ orderId, fileType, onSuccess }: LinkSubmissionProps) {
    const [link, setLink] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

                <button
                    type="submit"
                    disabled={loading || !link}
                    className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Submitting...' : 'Submit Link'}
                </button>
            </form>
        </div>
    )
}
