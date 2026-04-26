
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { withdrawalApi, ordersApi, paymentsApi, kycApi, disputeApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'

export default function AdminDashboardPage() {
    const router = useRouter()
    const user = getUser()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'WITHDRAWALS' | 'DISPUTES' | 'KYC'>('WITHDRAWALS')

    // --- WITHDRAWALS ---
    const { data: pendingWithdrawals } = useQuery({
        queryKey: ['admin-pending-withdrawals'],
        queryFn: async () => (await withdrawalApi.getPending()).data,
        enabled: user?.role === 'ADMIN'
    })

    const processWithdrawalMutation = useMutation({
        mutationFn: (data: { id: string; status: 'PROCESSED' | 'REJECTED'; adminNote?: string }) =>
            withdrawalApi.process(data.id, { status: data.status, adminNote: data.adminNote }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-pending-withdrawals'] })
    })

    const handleProcess = (id: string, decision: 'PROCESSED' | 'REJECTED') => {
        const note = prompt(decision === 'REJECTED' ? "Reason for rejection:" : "Transaction ID / Note (Optional):")
        if (decision === 'REJECTED' && !note) return;
        processWithdrawalMutation.mutate({ id, status: decision, adminNote: note || undefined })
    }

    // --- DISPUTES ---
    const { data: disputes } = useQuery({
        queryKey: ['admin-disputes'],
        queryFn: async () => (await disputeApi.list()).data,
        enabled: user?.role === 'ADMIN'
    })

    const resolveDisputeMutation = useMutation({
        mutationFn: (data: { id: string; resolution: 'FAVOR_EDITOR' | 'FAVOR_CREATOR'; note: string }) => 
            disputeApi.resolve(data.id, { resolution: data.resolution, note: data.note }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-disputes'] })
    })

    const handleResolveDispute = (dispute: any) => {
        const decision = confirm("Resolve in favor of EDITOR? (Cancel for CREATOR)") ? 'FAVOR_EDITOR' : 'FAVOR_CREATOR'
        const note = prompt("Admin Resolution Note:", "Resolved after manual review of activity logs.")
        if (!note) return;
        resolveDisputeMutation.mutate({ id: dispute.id, resolution: decision, note })
    }

    // --- KYC ---
    const { data: pendingKYC } = useQuery({
        queryKey: ['admin-pending-kyc'],
        queryFn: async () => (await kycApi.pending()).data,
        enabled: user?.role === 'ADMIN' && activeTab === 'KYC'
    })

    const approveKYCMutation = useMutation({
        mutationFn: (userId: string) => kycApi.approve(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-pending-kyc'] })
    })

    const rejectKYCMutation = useMutation({
        mutationFn: (data: { userId: string; reason: string }) => kycApi.reject(data.userId, data.reason),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-pending-kyc'] })
    })

    return (
        <div className="min-h-screen bg-neutral-900 text-white selection:bg-brand/30">
            <Navbar lightTheme={false} />
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent tracking-tight">Admin Terminal</h1>
                        <p className="text-gray-400 mt-2 text-sm font-medium">Monitoring platform integrity and editor reliability</p>
                    </div>
                    <div className="flex gap-4">
                         <div className="glass-morphism px-6 py-3 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Active Stakes</span>
                            <span className="text-xl font-bold text-brand">₹{pendingWithdrawals?.reduce((acc: number, r: any) => acc + r.amount, 0).toLocaleString() || 0}</span>
                         </div>
                    </div>
                </div>

                {/* Tabs with Glassmorphism */}
                <div className="inline-flex p-1.5 glass-morphism rounded-2xl border border-white/5 mb-10 overflow-x-auto max-w-full">
                    {[
                        { id: 'WITHDRAWALS', label: 'Withdrawals', count: pendingWithdrawals?.length },
                        { id: 'KYC', label: 'KYC Verification', count: pendingKYC?.length },
                        { id: 'DISPUTES', label: 'Disputes', count: disputes?.length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                activeTab === tab.id 
                                ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                                    activeTab === tab.id ? 'bg-white/20' : 'bg-brand/20 text-brand'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    {activeTab === 'WITHDRAWALS' && (
                        <div className="grid gap-4">
                            {pendingWithdrawals && pendingWithdrawals.length > 0 ? pendingWithdrawals.map((req: any) => (
                                <div key={req.id} className="glass-morphism-dark rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                            <span className="text-green-500 font-black text-xl">₹</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                                ₹{req.amount.toLocaleString()} 
                                                <span className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 rounded-full font-bold uppercase tracking-wider">{req.paymentMethod}</span>
                                            </h3>
                                            <p className="text-sm text-gray-400 font-medium">{req.user?.name} ({req.user?.email})</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => handleProcess(req.id, 'PROCESSED')}
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold transition-all"
                                        >
                                            Process Payout
                                        </button>
                                        <button
                                            onClick={() => handleProcess(req.id, 'REJECTED')}
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold border border-white/5 transition-all"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 text-gray-500 font-medium">No withdrawal requests found.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'KYC' && (
                        <div className="grid gap-4">
                            {pendingKYC && pendingKYC.length > 0 ? pendingKYC.map((profile: any) => (
                                <div key={profile.userId} className="glass-morphism-dark rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <span className="text-blue-500 font-black text-xl">ID</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{profile.user?.name}</h3>
                                                <p className="text-sm text-gray-400">{profile.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 w-full md:w-auto">
                                            <button
                                                onClick={() => approveKYCMutation.mutate(profile.userId)}
                                                className="flex-1 md:flex-none px-6 py-2.5 bg-brand hover:bg-brand text-white rounded-xl text-sm font-bold transition-all"
                                            >
                                                Verify Documents
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt("Rejection reason:")
                                                    if (reason) rejectKYCMutation.mutate({ userId: profile.userId, reason })
                                                }}
                                                className="flex-1 md:flex-none px-6 py-2.5 bg-white/5 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-bold border border-white/5 transition-all"
                                            >
                                                Reject Identity
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <a href={profile.kycIdUrl} target="_blank" className="group p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-300">View Legal ID</span>
                                            <span className="text-brand text-xs">Open Hook →</span>
                                        </a>
                                        <a href={profile.kycSelfieUrl} target="_blank" className="group p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-300">View Verification Selfie</span>
                                            <span className="text-brand text-xs">Open Hook →</span>
                                        </a>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 text-gray-500 font-medium">All KYC requests cleared.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'DISPUTES' && (
                        <div className="grid gap-4">
                            {disputes && disputes.length > 0 ? disputes.map((dispute: any) => (
                                <div key={dispute.id} className="glass-morphism-dark rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-white">{dispute.order?.title}</h3>
                                            <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-black uppercase">Active Dispute</span>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                            <b className="text-gray-200 block mb-1">Editor Reason:</b>
                                            {dispute.reason}
                                        </p>
                                        <div className="flex items-center gap-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Pool</span>
                                                <span className="text-lg font-bold text-white">₹{dispute.order?.amount?.toLocaleString()}</span>
                                            </div>
                                            {dispute.proofUrl && (
                                                <a href={dispute.proofUrl} target="_blank" className="text-brand text-xs font-bold hover:underline">View Proof →</a>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleResolveDispute(dispute)}
                                        className="w-full md:w-auto px-8 py-4 bg-brand hover:bg-brand text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-brand/20"
                                    >
                                        Execute Resolution
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-20 text-gray-500 font-medium">No open disputes reported.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
