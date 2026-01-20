'use client'

import { useState } from 'react'
import { paymentsApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import StripePaymentModal from '@/components/StripePaymentModal'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface PaymentButtonProps {
  projectId?: string  // Legacy support
  orderId?: string
  amount: number
  onSuccess?: () => void
}

export default function PaymentButton({ projectId, orderId, amount, onSuccess }: PaymentButtonProps) {
  const id = orderId || projectId
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

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      if (!id) {
        setError('Order ID is required')
        return
      }

      // Create payment order
      const orderResponse = await paymentsApi.createOrder(id)
      if (orderResponse.data.gateway === 'stripe') {
        setStripeClientSecret(orderResponse.data.clientSecret)
        return
      }

      // Load Razorpay SDK
      const loaded = await loadRazorpay()
      if (!loaded) {
        setError('Failed to load payment gateway')
        return
      }

      const { razorpayOrderId, keyId } = orderResponse.data

      // Initialize Razorpay
      const options = {
        key: keyId,
        amount: orderResponse.data.amount * 100, // Convert to paise
        currency: orderResponse.data.currency,
        name: 'Video Editing Marketplace',
        description: 'Project Payment',
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment (simplified for MVP)
            await paymentsApi.verify(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )
            if (onSuccess) {
              onSuccess()
            }
            router.refresh()
          } catch (err: any) {
            setError(err.response?.data?.error || 'Payment verification failed')
          }
        },
        prefill: {
          // You can prefill customer details here
        },
        theme: {
          color: '#4F46E5',
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
      setError(err.response?.data?.error || 'Payment initiation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSimulate = async () => {
    setLoading(true)
    setError('')
    try {
      if (!id) {
        setError('Order ID is required')
        return
      }

      // 1. Create Order to get Razorpay Order ID
      const orderResponse = await paymentsApi.createOrder(id)
      const data = orderResponse.data as any

      if (data.gateway === 'stripe') {
        alert('Simulation only works for Razorpay flow')
        return
      }

      const razorpayOrderId = data.razorpayOrderId

      // 2. Simulate Verify with Dummy Signature
      await paymentsApi.verify(
        razorpayOrderId,
        'dummy_pay_' + Date.now(),
        'dummy_signature_dev_mode'
      )

      if (onSuccess) onSuccess()
      router.refresh()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {stripeClientSecret && (
        <StripePaymentModal
          clientSecret={stripeClientSecret}
          title="Pay with Card"
          onClose={() => setStripeClientSecret(null)}
          onSuccess={() => {
            setStripeClientSecret(null)
            if (onSuccess) onSuccess()
            router.refresh()
          }}
        />
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Pay ₹${amount.toLocaleString()}`}
        </button>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm whitespace-nowrap"
          title="Simulate successful payment (Dev Only)"
        >
          Simulate Pay
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

