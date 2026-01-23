
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
        // In real app, middleware handles this. For client-side safety:
        if (typeof window !== 'undefined') {
            // Optional: router.push('/dashboard'); 
        }
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

    // --- DISPUTES ---
    const { data: disputedOrders, refetch: refetchDisputes } = useQuery({
        queryKey: ['admin-disputed-orders'],
        queryFn: async () => {
            const response = await ordersApi.list({ status: 'DISPUTED' })
            return response.data
        },
        enabled: user?.role === 'ADMIN' && activeTab === 'DISPUTES'
    })

    const resolveDisputeMutation = useMutation({
        mutationFn: (data: { id: string; resolution: 'REFUND_CREATOR' | 'PAY_EDITOR'; note: string }) => {
            // Map resolution to OrderStatus
            const status = data.resolution === 'REFUND_CREATOR' ? 'CANCELLED' : 'COMPLETED';
            return ordersApi.updateStatus(data.id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-disputed-orders'] })
            alert('Dispute resolved successfully')
        },
        onError: (err: any) => alert('Error resolving dispute: ' + err.message)
    })

    const handleResolveDispute = (orderId: string, resolution: 'REFUND_CREATOR' | 'PAY_EDITOR') => {
        const action = resolution === 'REFUND_CREATOR' ? 'Refund Creator (Cancel Order)' : 'Pay Editor (Complete Order)';
        const confirmMsg = `Are you sure you want to ${action}? This action is irreversible.`;
        if (!confirm(confirmMsg)) return;

        const note = prompt("Add a resolution note (optional):") || "Admin Resolution";

        resolveDisputeMutation.mutate({
            id: orderId,
            resolution,
            note
        })
    }

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
                            Active Disputes
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
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {disputedOrders && disputedOrders.length > 0 ? disputedOrders.map((order: any) => (
                                <li key={order.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex flex-col sm:flex-row justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{order.title}</h3>
                                                <p className="text-sm text-gray-500">Amount: ₹{order.amount}</p>
                                                <p className="text-sm text-red-600 mt-1">Reason: {order.disputeReason || 'No reason provided'}</p>
                                            </div>
                                            <div className="mt-4 sm:mt-0 flex flex-col space-y-2">
                                                <button
                                                    onClick={() => handleResolveDispute(order.id, 'PAY_EDITOR')}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                                >
                                                    Release to Editor
                                                </button>
                                                <button
                                                    onClick={() => handleResolveDispute(order.id, 'REFUND_CREATOR')}
                                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                                                >
                                                    Refund Creator
                                                </button>
                                            </div>
                                        </div>
                                        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <h4 className="font-semibold">Creator</h4>
                                                <p>{order.creator?.name}</p>
                                                <p>{order.creator?.email}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Editor</h4>
                                                <p>{order.editor?.name || 'Unassigned'}</p>
                                                <p>{order.editor?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            )) : (
                                <div className="p-10 text-center text-gray-500">
                                    No active disputes found.
                                </div>
                            )}
                        </ul>
                    </div>
                )}

            </div>
        </div>
    )
}
