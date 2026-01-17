
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { withdrawalApi, ordersApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'

export default function AdminDashboardPage() {
    const router = useRouter()
    const user = getUser()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'WITHDRAWALS' | 'DISPUTES'>('WITHDRAWALS')

    // Auth Check
    if (!user || user.role !== 'ADMIN') {
        // In real app, middleware handles this.
        // return <div className="p-10">Access Denied</div>
    }

    // --- WITHDRAWALS ---
    const { data: pendingWithdrawals, isLoading: isLoadingWithdrawals } = useQuery({
        queryKey: ['admin-pending-withdrawals'],
        queryFn: async () => {
            const response = await withdrawalApi.getPending()
            return response.data
        },
        enabled: user?.role === 'ADMIN'
    })

    const processWithdrawalMutation = useMutation({
        mutationFn: (data: { id: string; status: 'PROCESSED' | 'REJECTED'; adminNote?: string }) =>
            withdrawalApi.process(data.id, { status: data.status, adminNote: data.adminNote }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pending-withdrawals'] })
            alert('Withdrawal processed successfully')
        },
        onError: (err: any) => alert('Error processing: ' + err.message)
    })

    // --- DISPUTES (Placeholder logic if API not ready, but we'll try fetching open orders that are disputed) ---
    // We need a way to fetch Disputed orders. Currently ordersApi.list() gets all. 
    // We'll filter client side for MVP or add API param later.
    const { data: allOrders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            // Admin should use a specific adminList endpoint, but reusing list for now if allowed or add logic
            // Assuming user is ADMIN, maybe backend returns all? Or we need specific route.
            // For now, let's skip sophisticated dispute list and focus on Withdrawals.
            return []
        },
        enabled: false // Disable until API ready
    })

    const handleProcess = (id: string, decision: 'PROCESSED' | 'REJECTED') => {
        const note = prompt(decision === 'REJECTED' ? "Reason for rejection:" : "Transaction ID / Note (Optional):")
        if (decision === 'REJECTED' && !note) return; // Require reason for rejection?

        processWithdrawalMutation.mutate({
            id,
            status: decision,
            adminNote: note || undefined
        })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('WITHDRAWALS')}
                            className={`${activeTab === 'WITHDRAWALS' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Pending Withdrawals
                        </button>
                        <button
                            onClick={() => setActiveTab('DISPUTES')}
                            className={`${activeTab === 'DISPUTES' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Disputes (Coming Soon)
                        </button>
                    </nav>
                </div>

                {/* Content */}
                {activeTab === 'WITHDRAWALS' && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {pendingWithdrawals && pendingWithdrawals.length > 0 ? pendingWithdrawals.map((req: any) => (
                                <li key={req.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                                ₹{req.amount} — {req.user?.name} ({req.user?.email})
                                            </h3>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleProcess(req.id, 'PROCESSED')}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                >
                                                    Approve (Paid)
                                                </button>
                                                <button
                                                    onClick={() => handleProcess(req.id, 'REJECTED')}
                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-500">
                                            <p><strong>Method:</strong> {req.paymentMethod}</p>
                                            <p><strong>Details:</strong> {req.paymentDetails}</p>
                                            <p><strong>Requested:</strong> {new Date(req.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </li>
                            )) : (
                                <div className="p-4 text-center text-gray-500">No pending requests</div>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === 'DISPUTES' && (
                    <div className="p-10 text-center text-gray-500">
                        Dispute Management Interface is under construction.
                    </div>
                )}

            </div>
        </div>
    )
}
