import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'https://ecosystem-backend-1.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CREATOR' | 'EDITOR' | 'ADMIN';
  countryCode?: string;
  editorProfile?: {
    avatarUrl?: string;
  };
}

export interface Order {
  id: string;
  title: string;
  description?: string;
  brief?: string;
  status: string;
  amount?: number;
  currency?: string;
  paymentGateway?: string | null;
  paymentStatus?: string;
  payoutStatus?: string;
  editorDepositRequired?: boolean;
  editorDepositStatus?: string;
  creatorId: string;
  editorId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  youtubeVideoId?: string;
  youtubeVideoUrl?: string;
  publishedAt?: string;
  creator?: User;
  editor?: User;
  files?: File[];
  messages?: Message[];
  applications?: OrderApplication[];
  _count?: {
    messages: number;
    files: number;
  };
}

export interface OrderApplication {
  id: string;
  orderId: string;
  editorId: string;
  status: 'APPLIED' | 'APPROVED' | 'REJECTED';
  depositAmount: number;
  createdAt: string;
  editor?: User;
}

export interface EditorProfile {
  id: string;
  userId: string;
  bio?: string | null;
  avatarUrl?: string | null;
  rate?: number | null;
  skills: string[];
  portfolio: string[];
  available: boolean;
}

export interface EditorProfileResponse {
  id: string;
  name: string;
  email: string;
  role: 'EDITOR';
  walletBalance: number;
  walletLocked: number;
  editorProfile: EditorProfile | null;
  editorApplications: Array<{
    id: string;
    status: string;
    depositAmount: number;
    createdAt: string;
    order: {
      id: string;
      title: string;
      status: string;
      amount?: number;
      createdAt: string;
    };
  }>;
}

export interface File {
  id: string;
  orderId: string;
  type: 'RAW_VIDEO' | 'PREVIEW_VIDEO' | 'FINAL_VIDEO' | 'PORTFOLIO_VIDEO' | 'DOCUMENT' | 'OTHER';
  fileName: string;
  fileSize: number;
  mimeType?: string;
  duration?: number;
  version: number;
  uploadStatus: string; // "completed" for linked files
  provider?: string;
  externalFileId?: string;
  publicLink?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  orderId: string;
  fileId?: string;
  userId: string;
  type: 'COMMENT' | 'TIMESTAMP_COMMENT' | 'SYSTEM';
  content: string;
  timestamp?: number;
  x?: number;
  y?: number;
  resolved: boolean;
  createdAt: string;
  user?: User;
  file?: File;
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  processedAt?: string;
  releasedAt?: string | null;
  releaseNote?: string | null;
  createdAt: string;
}

export interface YouTubeAccount {
  id: string;
  userId: string;
  channelTitle: string;
  channelThumbnailUrl?: string;
  connectedAt: string;
}

export interface YouTubeUploadData {
  title: string;
  description?: string;
  tags?: string[];
  thumbnailUrl?: string;
  visibility?: 'private' | 'unlisted' | 'public';
  scheduledAt?: string;
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string; role: 'CREATOR' | 'EDITOR'; countryCode?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Legacy shims for compatibility (no-op)
export const projectsApi = {
  list: () => api.get<any[]>('/projects'),
  get: (id: string) => api.get<any>(`/projects/${id}`),
  create: (data: any) => api.post<any>('/projects', data),
  update: (id: string, data: any) => api.put<any>(`/projects/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch<any>(`/projects/${id}/status`, { status }),
}

export const videosApi = {
  getUploadUrl: (data: any) => api.post<any>('/videos/upload-url', data),
  completeUpload: (id: string) => api.post<any>(`/videos/${id}/complete`),
  getViewUrl: (id: string) => api.get<any>(`/videos/${id}/view-url`),
}

// Orders
export const ordersApi = {
  list: () => api.get<Order[]>('/orders'),
  listOpen: () => api.get<Order[]>('/orders', { params: { status: 'OPEN' } }),
  listAvailable: () => api.get<Order[]>('/orders', { params: { status: 'OPEN' } }),
  listAssigned: () => api.get<Order[]>('/orders', { params: { status: 'ASSIGNED' } }),
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  create: (data: { title: string; description?: string; brief?: string; amount?: number }) =>
    api.post<Order>('/orders', data),
  assign: (id: string, editorId: string) =>
    api.patch(`/orders/${id}/assign`, { editorId }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  approve: (id: string) =>
    api.post(`/orders/${id}/approve`),
  requestRevision: (id: string) =>
    api.post(`/orders/${id}/request-revision`),
  apply: (id: string) => api.post(`/orders/${id}/apply`),
  listApplications: (id: string) => api.get<OrderApplication[]>(`/orders/${id}/applications`),
  approveEditor: (orderId: string, applicationId: string) =>
    api.post(`/orders/${orderId}/approve-editor`, { applicationId }),
  getRawFiles: (id: string) =>
    api.get<File[]>(`/orders/${id}/raw-files`),
  getRawFileDownloadUrl: (orderId: string, fileId: string) =>
    api.get<{ downloadUrl: string; expiresIn: number; fileName: string; contentType?: string }>(
      `/orders/${orderId}/raw-files/${fileId}/download-url`
    ),
  getSubmissions: (id: string) =>
    api.get<File[]>(`/orders/${id}/submissions`),
  getSubmissionDownloadUrl: (orderId: string, fileId: string) =>
    api.get<{ downloadUrl: string; expiresIn: number; fileName: string; contentType?: string }>(
      `/orders/${orderId}/submissions/${fileId}/download-url`
    ),
  getActiveJobCount: () => api.get<{ activeJobs: number; maxActiveJobs: number; canApply: boolean }>('/orders/editor/active-count'),
  reportDispute: (id: string, reason: string) => api.post(`/orders/${id}/dispute`, { reason }),
};

export const editorApi = {
  profile: () => api.get<EditorProfileResponse>('/editor/profile'),
  updateProfile: (data: Partial<EditorProfile>) => api.put('/editor/profile', data),
  walletTopup: (amount: number) => api.post('/editor/wallet/topup', { amount }),
  uploadProfilePhoto: (data: { fileName: string; fileSize: number; mimeType: string }) =>
    api.post<{ uploadUrl: string; s3Key: string; fileUrl: string }>('/editor/profile-photo', data)
};

// Files
export const filesApi = {
  register: (data: {
    orderId: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    type: 'RAW_VIDEO' | 'PREVIEW_VIDEO' | 'FINAL_VIDEO' | 'PORTFOLIO_VIDEO' | 'DOCUMENT' | 'OTHER';
    provider: 'GOOGLE_DRIVE' | 'DROPBOX' | 'YOUTUBE';
    externalFileId?: string;
    publicLink?: string;
  }) => api.post<File>('/files/register', { ...data, fileType: data.type }),

  // Proxy Stream URL (pointing to backend /api/videos/:id/stream)
  getStreamUrl: (id: string) => `${API_URL}/videos/${id}/stream`,

  getDownloadUrl: (id: string) =>
    api.get<{ downloadUrl: string; expiresIn: number; fileName: string; contentType?: string }>(`/files/${id}/download-url`),
};

// Messages
export const messagesApi = {
  listByOrder: (orderId: string, fileId?: string, type?: string) => {
    const params = new URLSearchParams();
    if (fileId) params.append('fileId', fileId);
    if (type) params.append('type', type);
    return api.get<Message[]>(`/messages/order/${orderId}${params.toString() ? '?' + params.toString() : ''}`);
  },
  listByFile: (fileId: string) =>
    api.get<Message[]>(`/messages/file/${fileId}`),
  create: (data: {
    orderId: string;
    fileId?: string;
    content: string;
    timestamp?: number;
    x?: number;
    y?: number;
  }) => api.post<Message>('/messages', data),
  update: (id: string, data: { content?: string; resolved?: boolean }) =>
    api.patch<Message>(`/messages/${id}`, data),
  delete: (id: string) =>
    api.delete(`/messages/${id}`),
};

// Payments
export const paymentsApi = {
  createOrder: (orderId: string) =>
    api.post<
      | { gateway: 'razorpay'; paymentId: string; razorpayOrderId: string; amount: number; currency: string; keyId: string }
      | { gateway: 'stripe'; paymentId: string; clientSecret: string; amount: number; currency: string }
    >('/payments/create-order', { orderId }),
  verify: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) =>
    api.post('/payments/verify', { razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  createEditorDeposit: (orderId: string) =>
    api.post<
      | { gateway: 'razorpay'; editorDepositId: string; razorpayOrderId: string; amount: number; currency: string; keyId: string }
      | { gateway: 'stripe'; editorDepositId: string; clientSecret: string; amount: number; currency: string }
    >('/payments/editor-deposit/create', { orderId }),
  verifyEditorDeposit: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) =>
    api.post('/payments/editor-deposit/verify', { razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  list: (orderId: string) =>
    api.get<Payment[]>(`/payments/order/${orderId}`),
  get: (id: string) =>
    api.get<Payment>(`/payments/${id}`),
  adminList: (params?: { status?: string; released?: 'true' | 'false' }) =>
    api.get<any[]>(`/payments/admin/list`, { params }),
  release: (paymentId: string, releaseNote?: string) =>
    api.post(`/payments/${paymentId}/release`, { releaseNote }),
};

// YouTube
export const youtubeApi = {
  getStatus: () => api.get<{ connected: boolean; account?: YouTubeAccount }>('/youtube/status'),
  getAuthUrl: () => api.get<{ authUrl: string }>('/youtube/auth-url'),
  uploadToYouTube: (orderId: string, data: YouTubeUploadData) =>
    api.post<{ videoId: string; videoUrl: string }>(`/orders/${orderId}/youtube/upload`, data),
};

export const usersApi = {
  loadProfile: (userId: string) => api.get(`/users/${userId}/profile`),
  listEditors: () => api.get('/users/editors/profiles'),
  saveEditor: (editorId: string) => api.post<{ saved: boolean }>(`/users/editors/${editorId}/save`),
  listSavedEditors: () => api.get<any[]>('/users/creators/saved-editors'),
};

export const notificationsApi = {
  list: () => api.get<{ notifications: NotificationItem[], unreadCount: number }>('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const withdrawalApi = {
  request: (data: { amount: number; paymentMethod: string; paymentDetails: string }) =>
    api.post('/withdrawals/request', data),
  getMyRequests: () => api.get('/withdrawals/my'),
  getPending: () => api.get('/withdrawals/pending'),
  process: (id: string, data: { status: 'PROCESSED' | 'REJECTED'; adminNote?: string }) =>
    api.post(`/withdrawals/${id}/process`, data),
};

export const reviewsApi = {
  create: (data: { orderId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  listByUser: (userId: string) =>
    api.get<{ reviews: Review[]; aggregate: { count: number; average: number } }>(`/reviews/user/${userId}`),
  listByOrder: (orderId: string) =>
    api.get<Review[]>(`/reviews/order/${orderId}`),
};

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: User;
  order?: { id: string; title: string };
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default api;
