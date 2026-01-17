export const UserRole = {
    CREATOR: 'CREATOR',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrderStatus = {
    OPEN: 'OPEN',
    APPLIED: 'APPLIED',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    PREVIEW_SUBMITTED: 'PREVIEW_SUBMITTED',
    REVISION_REQUESTED: 'REVISION_REQUESTED',
    FINAL_SUBMITTED: 'FINAL_SUBMITTED',
    PUBLISHED: 'PUBLISHED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DISPUTED: 'DISPUTED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ApplicationStatus = {
    APPLIED: 'APPLIED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const WalletTransactionType = {
    DEPOSIT_LOCK: 'DEPOSIT_LOCK',
    DEPOSIT_RELEASE: 'DEPOSIT_RELEASE',
} as const;
export type WalletTransactionType = (typeof WalletTransactionType)[keyof typeof WalletTransactionType];

export const FileType = {
    RAW_VIDEO: 'RAW_VIDEO',
    PREVIEW_VIDEO: 'PREVIEW_VIDEO',
    FINAL_VIDEO: 'FINAL_VIDEO',
    PORTFOLIO_VIDEO: 'PORTFOLIO_VIDEO',
    DOCUMENT: 'DOCUMENT',
    OTHER: 'OTHER',
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

export const MessageType = {
    COMMENT: 'COMMENT',
    TIMESTAMP_COMMENT: 'TIMESTAMP_COMMENT',
    SYSTEM: 'SYSTEM',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const PaymentStatus = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentGateway = {
    RAZORPAY: 'RAZORPAY',
    STRIPE: 'STRIPE',
} as const;
export type PaymentGateway = (typeof PaymentGateway)[keyof typeof PaymentGateway];

export const PaymentKind = {
    CREATOR_PAYMENT: 'CREATOR_PAYMENT',
    EDITOR_DEPOSIT: 'EDITOR_DEPOSIT',
} as const;
export type PaymentKind = (typeof PaymentKind)[keyof typeof PaymentKind];

export const OrderPaymentStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
} as const;
export type OrderPaymentStatus = (typeof OrderPaymentStatus)[keyof typeof OrderPaymentStatus];

export const PayoutStatus = {
    PENDING: 'PENDING',
    RELEASED: 'RELEASED',
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const EditorDepositStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    REFUNDED: 'REFUNDED',
    FORFEITED: 'FORFEITED',
} as const;
export type EditorDepositStatus = (typeof EditorDepositStatus)[keyof typeof EditorDepositStatus];
