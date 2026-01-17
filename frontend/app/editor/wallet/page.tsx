
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { editorApi, withdrawalApi, User } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'

export default function EditorWalletPage() {
    const router = useRouter()
    const user = getUser()
    const queryClient = useQueryClient()

    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('UPI')
    const [paymentDetails, setPaymentDetails] = useState('')

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['editor-profile'],
        queryFn: async () => {
            const response = await editorApi.profile()
            return response.data
        }
    })

    const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
        queryKey: ['my-withdrawals'],
        queryFn: async () => {
            const response = await withdrawalApi.getMyRequests()
            return response.data
        }
    })

    const withdrawMutation = useMutation({
        mutationFn: (data: { amount: number; paymentMethod: string; paymentDetails: string }) =>
            withdrawalApi.request(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editor-profile'] })
            queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] })
            setShowWithdrawModal(false)
            setWithdrawAmount('')
            alert('Withdrawal request submitted successfully!')
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to request withdrawal')
        }
    })

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseFloat(withdrawAmount)
        if (!amount || amount < 500) {
            alert('Minimum withdrawal is ₹500')
            return
        }
        withdrawMutation.mutate({ amount, paymentMethod, paymentDetails })
    }

    if (!user || user.role !== 'EDITOR') {
        // Redirect handled by middleware mostly, but safe guard
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wallet</h1>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Available Balance</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                ₹{profile?.walletBalance?.toLocaleString() || '0'}
                            </dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Locked / Pending Withdrawal</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900 text-gray-400">
                                ₹{profile?.walletLocked?.toLocaleString() || '0'}
                            </dd>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mb-8">
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                        Request Withdrawal
                    </button>
                </div>

                {/* Withdrawal History */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Withdrawal History</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {withdrawals && withdrawals.length > 0 ? (
                            withdrawals.map((req: any) => (
                                <li key={req.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium text-indigo-600 truncate">
                                                ₹{req.amount} - {req.paymentMethod}
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${req.status === 'PROCESSED' ? 'bg-green-100 text-green-800' :
                                                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    {req.paymentDetails}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                    Requested on <time dateTime={req.createdAt}>{new Date(req.createdAt).toLocaleDateString()}</time>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-4 sm:px-6 text-gray-500 text-center">No withdrawal requests yet.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            Request Withdrawal
                                        </h3>
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Amount (Min ₹500)</label>
                                                <input
                                                    type="number"
                                                    value={withdrawAmount}
                                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    placeholder="0.00"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Available: ₹{profile?.walletBalance}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                                                <select
                                                    value={paymentMethod}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                >
                                                    <option value="UPI">UPI</option>
                                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                                    <option value="PAYPAL">PayPal</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Details (UPI ID / Bank Info)</label>
                                                <textarea
                                                    value={paymentDetails}
                                                    onChange={(e) => setPaymentDetails(e.target.value)}
                                                    rows={3}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    placeholder={paymentMethod === 'UPI' ? 'example@upi' : 'Account No, IFSC code...'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleWithdraw}
                                    disabled={withdrawMutation.isPending}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {withdrawMutation.isPending ? 'Processing...' : 'Submit Request'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
