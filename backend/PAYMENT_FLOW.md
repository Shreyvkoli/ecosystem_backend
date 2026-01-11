# Razorpay Payment Flow - MVP

## Overview

This MVP implements upfront payment by creators with manual release by admin. No escrow automation.

## Flow

1. **Creator Creates Order** → Order status: DRAFT, amount set
2. **Creator Creates Payment** → POST `/api/payments/create-order`
   - Creates Razorpay order
   - Payment status: PENDING
3. **Creator Pays via Razorpay Checkout** → Frontend handles Razorpay UI
4. **Payment Verification** → POST `/api/payments/verify`
   - Verifies payment signature
   - Payment status: COMPLETED (money received, not released)
5. **Webhook Handler** → POST `/api/payments/webhook`
   - Razorpay sends payment.captured event
   - Updates payment status to COMPLETED
6. **Admin Releases Payment** → POST `/api/payments/:paymentId/release`
   - Admin manually marks payment as released
   - Actual transfer to editor handled separately (outside this MVP)

---

## API Endpoints

### 1. Create Razorpay Order

**POST** `/api/payments/create-order`

**Auth:** CREATOR only

**Request:**
```json
{
  "orderId": "order-uuid"
}
```

**Response:**
```json
{
  "paymentId": "payment-uuid",
  "razorpayOrderId": "order_xyz123",
  "amount": 5000,
  "currency": "INR",
  "keyId": "rzp_test_xxx"
}
```

**Use:** Pass `razorpayOrderId` and `keyId` to Razorpay checkout.

---

### 2. Verify Payment

**POST** `/api/payments/verify`

**Auth:** CREATOR only

**Request:**
```json
{
  "razorpayOrderId": "order_xyz123",
  "razorpayPaymentId": "pay_abc456",
  "razorpaySignature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "payment-uuid",
    "status": "COMPLETED",
    "amount": 5000,
    "processedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Payment verified successfully. Payment will be released after order completion."
}
```

**Use:** After Razorpay checkout success, verify payment before showing success page.

---

### 3. Webhook Handler

**POST** `/api/payments/webhook`

**Auth:** None (uses signature verification)

**Headers:**
```
X-Razorpay-Signature: signature_hash
Content-Type: application/json
```

**Request Body:** (from Razorpay)
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc456",
        "order_id": "order_xyz123",
        "status": "captured",
        "amount": 500000
      }
    }
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Setup:** Configure webhook URL in Razorpay dashboard:
- Events: `payment.captured`, `payment.failed`
- URL: `https://your-api.com/api/payments/webhook`
- Secret: Set `RAZORPAY_WEBHOOK_SECRET` in env (or uses `RAZORPAY_KEY_SECRET`)

---

### 4. Release Payment (Admin)

**POST** `/api/payments/:paymentId/release`

**Auth:** ADMIN only

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "payment-uuid",
    "status": "COMPLETED",
    "processedAt": "2024-01-15T12:00:00Z"
  },
  "message": "Payment marked as released. Actual transfer should be processed via Razorpay."
}
```

**Note:** In MVP, this just marks payment as released. Actual transfer to editor should be done via Razorpay dashboard or payout API separately.

---

### 5. Get Payments for Order

**GET** `/api/payments/order/:orderId`

**Auth:** CREATOR, EDITOR, or ADMIN

**Response:**
```json
[
  {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "userId": "creator-uuid",
    "amount": 5000,
    "currency": "INR",
    "status": "COMPLETED",
    "razorpayOrderId": "order_xyz123",
    "razorpayPaymentId": "pay_abc456",
    "processedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-15T10:25:00Z",
    "user": {
      "id": "creator-uuid",
      "name": "John Creator",
      "email": "john@example.com"
    }
  }
]
```

---

### 6. Get Payment Details

**GET** `/api/payments/:id`

**Auth:** CREATOR, EDITOR (on their order), or ADMIN

**Response:**
```json
{
  "id": "payment-uuid",
  "orderId": "order-uuid",
  "amount": 5000,
  "status": "COMPLETED",
  "razorpayOrderId": "order_xyz123",
  "razorpayPaymentId": "pay_abc456",
  "order": {
    "id": "order-uuid",
    "title": "Video Editing Project",
    "creator": { "name": "John Creator" },
    "editor": { "name": "Jane Editor" }
  }
}
```

---

## Payment Status Flow

```
PENDING → COMPLETED (via verify/webhook)
         ↓
      (Admin releases manually)
         ↓
   processedAt updated (still COMPLETED)
```

**Statuses:**
- `PENDING` - Payment order created, not paid yet
- `PROCESSING` - Payment initiated (optional, not used in MVP)
- `COMPLETED` - Payment received (money with Razorpay, not released)
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

---

## Environment Variables

```env
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret  # Optional, falls back to KEY_SECRET
```

---

## Frontend Integration Example

```typescript
// 1. Create payment order
const createPayment = async (orderId: string) => {
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderId })
  });
  return response.json();
};

// 2. Initialize Razorpay checkout
const options = {
  key: paymentData.keyId,
  amount: paymentData.amount * 100,
  currency: paymentData.currency,
  order_id: paymentData.razorpayOrderId,
  name: 'Video Marketplace',
  description: 'Order Payment',
  handler: async function(response: any) {
    // 3. Verify payment
    const verifyResponse = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      })
    });
    
    const result = await verifyResponse.json();
    if (result.success) {
      // Show success page
    }
  },
  prefill: {
    email: user.email,
    name: user.name
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

---

## Security Notes

1. **Signature Verification:** All webhooks and payment verifications use HMAC SHA256 signatures
2. **Webhook Secret:** Use separate webhook secret in production
3. **Access Control:** Payments can only be created by order creators, released by admins
4. **No Public Access:** Payment endpoints require authentication

---

## MVP Limitations

- No automatic escrow
- No automatic payout to editor
- Admin must manually release (tracked via `processedAt`)
- Actual transfer to editor handled outside this system
- Refunds handled manually via Razorpay dashboard

