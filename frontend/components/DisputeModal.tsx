'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { ordersApi } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface DisputeModalProps {
    isOpen: boolean
    onClose: () => void
    orderId: string
}

export default function DisputeModal({ isOpen, onClose, orderId }: DisputeModalProps) {
    const [reason, setReason] = useState('')
    const queryClient = useQueryClient()

    const disputeMutation = useMutation({
        mutationFn: (data: { id: string; reason: string }) =>
            ordersApi.reportDispute(data.id, data.reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] })
            onClose()
            setReason('')
            alert('Dispute reported. An admin will review this order shortly.')
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || 'Failed to report dispute')
        }
    })

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Please provide a reason for the dispute')
            return
        }
        disputeMutation.mutate({
            id: orderId,
            reason
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

                <div className="flex items-center mb-4 text-red-600">
                    <AlertTriangle size={24} className="mr-2" />
                    <h2 className="text-xl font-bold">Report Dispute</h2>
                </div>

                <p className="text-gray-600 mb-6 text-sm">
                    Disputing an order will alert the Admin team. Use this if there is a serious issue (scam, payment refusal, harassment).
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Dispute
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe the issue in detail..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
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
                        disabled={disputeMutation.isPending || !reason.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {disputeMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
                    </button>
                </div>
            </div>
        </div>
    )
}
