'use client'

import { useEffect, useMemo, useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'

interface StripePaymentModalProps {
  clientSecret: string
  onSuccess?: () => void
  onClose: () => void
  title: string
}

function InnerStripePaymentModal({ onSuccess, onClose, title }: Omit<StripePaymentModalProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!stripe || !elements) {
      setError('Payment system not ready')
      return
    }

    setSubmitting(true)
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
        return
      }

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <PaymentElement />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!stripe || !elements || submitting}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Pay'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function StripePaymentModal({ clientSecret, onSuccess, onClose, title }: StripePaymentModalProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)

  useEffect(() => {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!pk) {
      setStripePromise(null)
      return
    }
    setStripePromise(loadStripe(pk))
  }, [])

  const options = useMemo(() => ({ clientSecret }), [clientSecret])

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
          <p className="text-sm text-red-600">Stripe publishable key is not configured.</p>
          <div className="mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
          </div>
        </div>
      </div>
    )
  }

  if (!stripePromise) {
    return null
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <InnerStripePaymentModal onSuccess={onSuccess} onClose={onClose} title={title} />
    </Elements>
  )
}
