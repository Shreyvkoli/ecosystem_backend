'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { paymentsApi } from '@/lib/api'
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
      // Create order first
      const resp = await paymentsApi.createEditorDeposit(orderId);

      // Simulate successful verification with dummy data
      await paymentsApi.verifyEditorDeposit(
        (resp.data as any).razorpayOrderId || 'test_order_id',
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

      const options = {
        key: resp.data.keyId,
        amount: resp.data.amount * 100,
        currency: resp.data.currency,
        name: 'Video Editing Marketplace',
        description: 'Editor Security Deposit',
        order_id: resp.data.razorpayOrderId,
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
      {stripeClientSecret && (
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
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDeposit}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay Deposit'}
        </button>
        <button
          onClick={handleTestDeposit}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 text-sm whitespace-nowrap"
          title="Simulate successful payment"
        >
          Dev Pay (Dummy)
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
