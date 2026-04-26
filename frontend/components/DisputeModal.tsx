
'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kycApi } from '@/lib/api'
import { AlertTriangle, ShieldCheck, X } from 'lucide-react'

interface DisputeModalProps {
    orderId: string
    isOpen: boolean
    onClose: () => void
}

export default function DisputeModal({ orderId, isOpen, onClose }: DisputeModalProps) {
    const [reason, setReason] = useState('')
    const [proofUrl, setProofUrl] = useState('')
    const queryClient = useQueryClient()

    const disputeMutation = useMutation({
        mutationFn: async (data: { orderId: string; reason: string; proofUrl?: string }) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/disputes/raise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            })
            if (!response.ok) throw new Error('Failed to raise dispute')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] })
            onClose()
            alert('Dispute raised. Admin will review your activity logs.')
        }
    })

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-indigo-600" />
                            <h2 className="text-xl font-bold text-gray-900">Challenge Penalty</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <b>Important:</b> Disputes are reviewed based on your activity logs (uploads started, link clicks). Falsifying a dispute can lead to a permanent ban.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Reason for Dispute</label>
                            <textarea 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. My internet was out for 4 hours, or the file was 50GB and took longer to sync..."
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[120px] text-sm"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Min 20 characters required.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Proof Link (Optional)</label>
                            <input 
                                type="url"
                                value={proofUrl}
                                onChange={(e) => setProofUrl(e.target.value)}
                                placeholder="Screenshot of upload progress..."
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>

                        <button
                            onClick={() => disputeMutation.mutate({ orderId, reason, proofUrl })}
                            disabled={reason.length < 20 || disputeMutation.isPending}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                        >
                            {disputeMutation.isPending ? 'Submitting...' : 'Confirm Dispute'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
