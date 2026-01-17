
'use client'

import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { reviewsApi } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    orderId: string
    revieweeName?: string
}

export default function ReviewModal({ isOpen, onClose, orderId, revieweeName }: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const queryClient = useQueryClient()

    const createReviewMutation = useMutation({
        mutationFn: (data: { orderId: string; rating: number; comment?: string }) =>
            reviewsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] })
            queryClient.invalidateQueries({ queryKey: ['order', orderId] })
            onClose()
            alert('Review submitted successfully!')
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || 'Failed to submit review')
        }
    })

    const handleSubmit = () => {
        if (rating === 0) {
            alert('Please select a rating')
            return
        }
        createReviewMutation.mutate({
            orderId,
            rating,
            comment
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Rate Your Experience
                </h2>

                <p className="text-gray-600 mb-6">
                    How was working with <span className="font-semibold">{revieweeName || 'User'}</span>?
                </p>

                <div className="flex justify-center mb-6 space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className="focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                size={32}
                                className={`${(hoverRating || rating) >= star
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    } transition-colors`}
                            />
                        </button>
                    ))}
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Write a Review (Optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your feedback..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={createReviewMutation.isPending || rating === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    )
}
