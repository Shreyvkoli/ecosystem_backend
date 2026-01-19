'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { paymentsApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import StripePaymentModal from '@/components/StripePaymentModal'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface EditorDepositButtonProps {
  orderId: string
  onSuccess?: () => void
}

export default function EditorDepositButton({ orderId, onSuccess }: EditorDepositButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const router = useRouter()

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleTestDeposit = async () => {
    setLoading(true);
    try {
      const resp = await paymentsApi.createEditorDeposit(orderId);

      if (resp.data.gateway === 'stripe') {
        alert('Dev Pay (Dummy) is currently only supported for Razorpay (India). Please switch country or use real payment.');
        setLoading(false);
        return;
      }

      // Simulate successful verification with dummy data
      await paymentsApi.verifyEditorDeposit(
        resp.data.razorpayOrderId,
        'pay_test_' + Date.now(),
        'dummy_signature_dev_mode'
      );

      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Test deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true)
    setError('')

    try {
      const resp = await paymentsApi.createEditorDeposit(orderId)

      if (resp.data.gateway === 'stripe') {
        setStripeClientSecret(resp.data.clientSecret)
        return
      }

      const loaded = await loadRazorpay()
      if (!loaded) {
        setError('Failed to load payment gateway')
        return
      }

      const user = getUser()
      const options = {
        key: resp.data.keyId,
        amount: resp.data.amount * 100,
        currency: resp.data.currency,
        name: 'Cutflow',
        description: 'Editor Security Deposit',
        order_id: resp.data.razorpayOrderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: '' // Can be added if we store phone numbers
        },
        theme: {
          color: '#4f46e5' // Indigo-600 to match app theme
        },
        handler: async function (response: any) {
          try {
            await paymentsApi.verifyEditorDeposit(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )
            if (onSuccess) onSuccess()
            router.refresh()
          } catch (err: any) {
            setError(err.response?.data?.error || 'Deposit verification failed')
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Deposit initiation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* {stripeClientSecret && (
        <StripePaymentModal
          clientSecret={stripeClientSecret}
          title="Pay Deposit"
          onClose={() => setStripeClientSecret(null)}
          onSuccess={() => {
            setStripeClientSecret(null)
            if (onSuccess) onSuccess()
            router.refresh()
          }}
        />
      )} */}

      <div className="flex gap-2">
        <button
          onClick={handleDeposit}
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Processing...' : 'Pay Security Deposit'}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
