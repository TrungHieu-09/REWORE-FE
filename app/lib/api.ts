export const API_BASE_URL =
  process.env.NEXT_PUBLIC_REWORE_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export const AUTH_TOKEN_KEY = "rewore_token";
export const AUTH_FLAG_KEY = "rewore_authed";
export const AUTH_USER_KEY = "rewore_user";
export const PENDING_OTP_EMAIL_KEY = "rewore_pending_otp_email";

export function apiAssetUrl(value?: string | null, fallback = "") {
  if (!value) return fallback;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export type Role = "BUYER" | "SELLER" | "ADMIN";
export type ProductStatus = "ACTIVE" | "SOLD" | "AUCTION" | "INACTIVE" | "HIDDEN" | "REMOVED";
export type ProductAvailabilityStatus = "upcoming_drop" | "available" | "held" | "sold";
export type ProductCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
export type AuctionStatus = "UPCOMING" | "LIVE" | "ENDED" | "CANCELLED";
export type SellerApplicationStatus =
  | "PENDING"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";
export type SellerStatus =
  | "NONE"
  | "PENDING"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type ApiMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiListResponse<T> = {
  success: true;
  data: T[];
  meta: ApiMeta;
};

export type ApiItemResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string;
  requiresOtp?: boolean;
  email?: string;
  retryAfter?: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  role: Role;
  reputation: number;
  totalSales: number;
  totalBids: number;
  isVerified: boolean;
  isBanned?: boolean;
  bannedReason?: string | null;
  bannedAt?: string | null;
  sellerStatus?: SellerStatus;
  sellerApprovedAt?: string | null;
  sellerSuspendedReason?: string | null;
  sellerProfile?: {
    id: string;
    shopName: string;
    shop_name?: string;
    idCardFrontUrl?: string | null;
    idCardBackUrl?: string | null;
    selfieUrl?: string | null;
    id_card_front_url?: string | null;
    id_card_back_url?: string | null;
    selfie_url?: string | null;
    status: SellerApplicationStatus;
    pickupAddress?: string | null;
    bankName?: string | null;
    bankAccountName?: string | null;
    createdAt?: string;
  } | null;
  createdAt: string;
};

export type SellerPublic = Pick<User, "id" | "name"> &
  Partial<Pick<User, "email" | "avatar" | "reputation" | "isVerified" | "role" | "sellerProfile" | "sellerStatus">> & {
    shopName?: string | null;
    shop_name?: string | null;
  };

export function sellerDisplayName(seller?: SellerPublic | null, fallback = "REWORE Seller") {
  return (
    seller?.sellerProfile?.shopName ||
    seller?.sellerProfile?.shop_name ||
    seller?.shopName ||
    seller?.shop_name ||
    seller?.name ||
    fallback
  );
}

export type AuthUser = Partial<User> & {
  id: string;
  email: string;
  name: string;
  role?: Role;
};

export type AuthResponse = {
  success: true;
  token: string;
  user: AuthUser;
};

export type RegisterOtpResponse = {
  success: true;
  message: string;
  email?: string;
  requiresOtp: true;
};

export type ResendOtpResponse = {
  success: true;
  message: string;
};

export type MeResponse = {
  success: true;
  user: User;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: ProductCondition;
  status: ProductStatus;
  quantity?: number;
  availabilityStatus?: ProductAvailabilityStatus;
  brand: string | null;
  size: string | null;
  color: string | null;
  tags: string[];
  viewCount: number;
  sellerId: string;
  seller?: SellerPublic;
  _count?: {
    wishlistItems: number;
  };
  auction?: Auction | null;
  createdAt: string;
  updatedAt: string;
};

export type Auction = {
  id: string;
  productId: string;
  sellerId: string;
  startPrice: number;
  currentBid: number;
  minIncrement: number;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  winnerId: string | null;
  product?: Product;
  seller?: SellerPublic;
  bids?: Bid[];
  _count?: {
    bids: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type Bid = {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  isWinning: boolean;
  bidder?: Pick<User, "id" | "name" | "avatar">;
  auction?: Auction;
  createdAt: string;
};

export type Order = {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string | null;
  auctionId: string | null;
  totalPrice: number;
  shippingFee: number;
  paymentStatus?: PaymentStatus;
  status: OrderStatus;
  qrCodeRef?: string | null;
  shippingAddress: string | null;
  note: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  platformFeeRate?: number | null;
  platformFeeAmount?: number | null;
  sellerPayoutAmount?: number | null;
  payoutPaidAt?: string | null;
  buyer?: Pick<User, "id" | "name" | "avatar" | "email">;
  seller?: SellerPublic;
  product?: Pick<Product, "id" | "title" | "images" | "category" | "price" | "status" | "availabilityStatus"> | null;
  auction?: Pick<Auction, "id" | "currentBid" | "endTime"> | null;
  createdAt: string;
  updatedAt: string;
};

export type WishlistItem = {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
};

export type CartItem = {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  isAvailable: boolean;
  unavailableReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerApplication = {
  id: string;
  userId: string;
  shopName: string;
  shop_name?: string;
  legalName?: string;
  legal_name?: string;
  idCardFrontImage?: string;
  idCardBackImage?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  selfieUrl?: string | null;
  selfie_url?: string | null;
  phone?: string;
  pickupAddress: string;
  bankName: string | null;
  bankAccountNumber: string;
  bankAccountHolder?: string;
  vietQr?: string | null;
  sellingDescription?: string | null;
  acceptedSellerTerms?: boolean;
  status: SellerApplicationStatus;
  rejectionReason: string | null;
  reviewedByAdminId: string | null;
  reviewedAt: string | null;
  rejectedReason?: string | null;
  reviewedBy?: string | null;
  user?: Pick<User, "id" | "email" | "name" | "phone" | "address" | "role" | "isVerified" | "sellerStatus" | "createdAt"> & {
    isBanned?: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type SellerShopProfile = {
  id: string;
  shopName: string;
  pickupAddress: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  status: SellerApplicationStatus;
  user: { id: string; name: string; avatar: string | null; bio: string | null };
  canEdit: boolean;
};

export type UpdateSellerShopPayload = Partial<
  Pick<SellerShopProfile, "shopName" | "pickupAddress" | "bankName" | "bankAccountName" | "bankAccountNumber">
> & { bio?: string | null };

export type SellerSalesReport = {
  months: number;
  feeRate: number;
  totals: { orders: number; gross: number; fee: number; net: number; paidOut: number; pendingPayout: number };
  monthly: { month: string; orders: number; gross: number; fee: number; net: number }[];
  topProducts: { productId: string; title: string; orders: number; gross: number }[];
  recentSettled: {
    id: string;
    title: string;
    createdAt: string;
    totalPrice: number;
    platformFeeAmount: number;
    sellerPayoutAmount: number;
    payoutPaidAt: string | null;
  }[];
};

export type SellerStats = {
  products: { total: number; byStatus: Record<string, number> };
  orders: { total: number; byStatus: Record<string, number> };
  revenue: { total: number; thisMonth: number };
  platformFees: { rate: number; total: number };
  payout: { net: number; pending: number };
  liveAuctions: number;
};

export type CreateUserPayload = {
  email: string;
  name: string;
  password: string;
  phone?: string;
  address?: string;
  role: "BUYER" | "SELLER";
  shopName?: string;
};

export type SellerReport = {
  id: string;
  reporterId: string;
  targetType?: "USER" | "PRODUCT" | "ORDER";
  targetId?: string;
  sellerId?: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  resolutionAction?: "WARN" | "SUSPEND" | "DISMISS" | null;
  resolutionNote?: string | null;
  reporter?: Pick<User, "id" | "email" | "name" | "avatar">;
  resolvedByAdmin?: Pick<User, "id" | "email" | "name">;
  seller?: SellerPublic;
  createdAt: string;
  updatedAt: string;
};

export type CreateReportPayload = {
  targetType: "USER" | "PRODUCT" | "ORDER";
  targetId: string;
  reason: string;
  description?: string;
};

export type ProductListQuery = {
  page?: number;
  limit?: number;
  category?: string;
  condition?: ProductCondition;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sellerId?: string;
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
};

export type AuctionListQuery = {
  page?: number;
  limit?: number;
  status?: AuctionStatus;
  category?: string;
};

export type PageQuery = {
  page?: number;
  limit?: number;
};

export type OrderListQuery = PageQuery & {
  role?: "buyer" | "seller";
  status?: OrderStatus;
};

export type UserListQuery = PageQuery & {
  search?: string;
  status?: "active" | "banned";
  sortBy?: "createdAt" | "email" | "name" | "role";
  sortOrder?: "asc" | "desc";
};

export type AdminApplicationQuery = PageQuery & {
  status?: SellerApplicationStatus | "ALL";
};

export type AdminReportQuery = PageQuery & {
  status?: ReportStatus | "ALL";
};

export type AdminProductQuery = PageQuery & {
  status?: ProductStatus | "ALL";
  sellerId?: string;
  sortBy?: "createdAt" | "price" | "title" | "status" | "viewCount" | "availabilityStatus";
  sortOrder?: "asc" | "desc";
};

export type CreateProductPayload = {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ProductCondition;
  quantity?: 1;
  images?: Array<string | File>;
  brand?: string;
  size?: string;
  color?: string;
  tags?: string[];
};

export type CreateAuctionPayload = {
  productId: string;
  startPrice: number;
  minIncrement?: number;
  startTime: string;
  endTime: string;
};

export type UpdateUserPayload = Partial<
  Pick<User, "name" | "bio" | "phone" | "address" | "avatar">
>;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  requiresOtp?: boolean;
  email?: string;
  retryAfter?: number;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
    meta?: Pick<ApiErrorResponse, "requiresOtp" | "email" | "retryAfter">
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.requiresOtp = meta?.requiresOtp;
    this.email = meta?.email;
    this.retryAfter = meta?.retryAfter;
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuth(token: string, user: AuthUser | User) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_FLAG_KEY, "true");
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_FLAG_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser(): AuthUser | User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser | User) : null;
  } catch {
    return null;
  }
}

export function setPendingOtpEmail(email: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_OTP_EMAIL_KEY, email);
}

export function getPendingOtpEmail() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(PENDING_OTP_EMAIL_KEY) ?? "";
}

export function clearPendingOtpEmail() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_OTP_EMAIL_KEY);
}

function toQueryString(params?: Record<string, string | number | undefined>) {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

function productRequestBody(payload: Partial<CreateProductPayload>, forceFormData = false) {
  const images = payload.images ?? [];
  const fileImages =
    typeof File !== "undefined" ? images.filter((image): image is File => image instanceof File) : [];

  if (!forceFormData && fileImages.length === 0) return JSON.stringify(payload);

  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.description !== undefined) formData.append("description", payload.description);
  if (payload.price !== undefined) formData.append("price", String(payload.price));
  if (payload.category !== undefined) formData.append("category", payload.category);
  if (payload.condition !== undefined) formData.append("condition", payload.condition);
  if (payload.quantity !== undefined) formData.append("quantity", String(payload.quantity));
  if (payload.brand !== undefined) formData.append("brand", payload.brand);
  if (payload.size !== undefined) formData.append("size", payload.size);
  if (payload.color !== undefined) formData.append("color", payload.color);
  if (payload.tags !== undefined) formData.append("tags", JSON.stringify(payload.tags));

  const imageUrls = images.filter((image): image is string => typeof image === "string");
  if (imageUrls.length) formData.append("images", JSON.stringify(imageUrls));
  fileImages.forEach((file) => formData.append("productImages", file));

  return formData;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers, body, ...init } = options;
  const token = auth ? getStoredToken() : null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    body,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const json = await readJson<T | ApiErrorResponse>(response);
  const isApiError =
    typeof json === "object" &&
    json !== null &&
    "success" in json &&
    json.success === false;

  if (!response.ok || isApiError) {
    const error = json as ApiErrorResponse;
    throw new ApiError(
      error.message || `Request failed with status ${response.status}`,
      response.status,
      error.errors,
      {
        requiresOtp: error.requiresOtp,
        email: error.email,
        retryAfter: error.retryAfter,
      }
    );
  }

  return json as T;
}

export const healthApi = {
  check: () => apiRequest<{ status: "ok"; timestamp: string }>("/health"),
};

export const authApi = {
  register: (payload: { email: string; password: string; name: string }) =>
    apiRequest<RegisterOtpResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyOtp: (payload: { email: string; otp: string }) =>
    apiRequest<AuthResponse>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resendOtp: (payload: { email: string }) =>
    apiRequest<ResendOtpResponse>("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => apiRequest<MeResponse>("/api/auth/me", { auth: true }),
  logout: () =>
    apiRequest<{ success: true; message: string }>("/api/auth/logout", {
      method: "POST",
      auth: true,
    }),
  forgotPassword: (payload: { email: string }) =>
    apiRequest<{ success: true; message: string; expiresInMinutes?: number; resendCooldownSeconds?: number }>(
      "/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
  verifyResetOtp: (payload: { email: string; otp: string }) =>
    apiRequest<{ success: true; resetToken: string }>("/api/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload: { token: string; password: string }) =>
    apiRequest<{ success: true; message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const usersApi = {
  list: (query?: UserListQuery) =>
    apiRequest<ApiListResponse<User>>(`/api/users${toQueryString(query)}`, {
      auth: true,
    }),
  get: (id: string) => apiRequest<ApiItemResponse<User>>(`/api/users/${id}`),
  update: (id: string, payload: UpdateUserPayload) =>
    apiRequest<ApiItemResponse<User>>(`/api/users/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    }),
  delete: (id: string) =>
    apiRequest<{ success: true; message: string }>(`/api/users/${id}`, {
      method: "DELETE",
      auth: true,
    }),
};

export const productsApi = {
  list: (query?: ProductListQuery) =>
    apiRequest<ApiListResponse<Product>>(`/api/products${toQueryString(query)}`),
  get: (id: string) => apiRequest<ApiItemResponse<Product>>(`/api/products/${id}`),
  create: (payload: CreateProductPayload) =>
    apiRequest<ApiItemResponse<Product>>("/api/products", {
      method: "POST",
      auth: true,
      body: productRequestBody({ ...payload, quantity: 1 }, true),
    }),
  update: (id: string, payload: Partial<CreateProductPayload>) =>
    apiRequest<ApiItemResponse<Product>>(`/api/products/${id}`, {
      method: "PUT",
      auth: true,
      body: productRequestBody(payload, true),
    }),
  delete: (id: string) =>
    apiRequest<{ success: true; message: string }>(`/api/products/${id}`, {
      method: "DELETE",
      auth: true,
    }),
};

export const auctionsApi = {
  list: (query?: AuctionListQuery) =>
    apiRequest<ApiListResponse<Auction>>(`/api/auctions${toQueryString(query)}`),
  get: (id: string) => apiRequest<ApiItemResponse<Auction>>(`/api/auctions/${id}`),
  create: (payload: CreateAuctionPayload) =>
    apiRequest<ApiItemResponse<Auction>>("/api/auctions", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    }),
  cancel: (id: string) =>
    apiRequest<{ success: true; message: string; data: Auction }>(
      `/api/auctions/${id}/cancel`,
      {
        method: "PATCH",
        auth: true,
      }
    ),
  close: (id: string) =>
    apiRequest<{ success: true; message: string; data: Auction }>(
      `/api/auctions/${id}/close`,
      {
        method: "POST",
        auth: true,
      }
    ),
};

export const bidsApi = {
  create: (payload: { auctionId: string; amount: number }) =>
    apiRequest<ApiItemResponse<Bid>>("/api/bids", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    }),
  forAuction: (auctionId: string, query?: PageQuery) =>
    apiRequest<ApiListResponse<Bid>>(
      `/api/bids/auction/${auctionId}${toQueryString(query)}`
    ),
  myBids: (query?: PageQuery) =>
    apiRequest<ApiListResponse<Bid>>(`/api/bids/my-bids${toQueryString(query)}`, {
      auth: true,
    }),
};

export const ordersApi = {
  list: (query?: OrderListQuery) =>
    apiRequest<ApiListResponse<Order>>(`/api/orders${toQueryString(query)}`, {
      auth: true,
    }),
  create: (payload: {
    productId: string;
    receiverName?: string;
    receiverPhone?: string;
    shippingAddress?: string;
    note?: string;
  }) =>
    apiRequest<ApiItemResponse<Order> & { message: string }>("/api/orders", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    }),
  uploadPaymentProof: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("paymentProof", file);
    return apiRequest<ApiItemResponse<Order> & { message: string }>(`/api/orders/${id}/payment-proof`, {
      method: "POST",
      auth: true,
      body: formData,
    });
  },
  get: (id: string) =>
    apiRequest<ApiItemResponse<Order>>(`/api/orders/${id}`, { auth: true }),
  updateStatus: (id: string, status: OrderStatus) =>
    apiRequest<ApiItemResponse<Order>>(`/api/orders/${id}/status`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ status }),
    }),
};

export const cartApi = {
  list: (query?: PageQuery) =>
    apiRequest<ApiListResponse<CartItem>>(`/api/cart${toQueryString(query)}`, {
      auth: true,
    }),
  add: (productId: string) =>
    apiRequest<ApiItemResponse<CartItem>>("/api/cart", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ productId }),
    }),
  remove: (productId: string) =>
    apiRequest<{ success: true; message: string }>(`/api/cart/${productId}`, {
      method: "DELETE",
      auth: true,
    }),
  check: (productId: string) =>
    apiRequest<{ success: true; isInCart: boolean; item: CartItem | null }>(
      `/api/cart/check/${productId}`,
      { auth: true }
    ),
};

export const wishlistApi = {
  list: (query?: PageQuery) =>
    apiRequest<ApiListResponse<WishlistItem>>(
      `/api/wishlist${toQueryString(query)}`,
      { auth: true }
    ),
  add: (productId: string) =>
    apiRequest<ApiItemResponse<WishlistItem>>("/api/wishlist", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ productId }),
    }),
  remove: (productId: string) =>
    apiRequest<{ success: true; message: string }>(`/api/wishlist/${productId}`, {
      method: "DELETE",
      auth: true,
    }),
  check: (productId: string) =>
    apiRequest<{ success: true; isInWishlist: boolean }>(
      `/api/wishlist/check/${productId}`,
      { auth: true }
    ),
};

export const reportsApi = {
  create: (payload: CreateReportPayload) =>
    apiRequest<ApiItemResponse<SellerReport> & { message: string }>("/api/reports", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    }),
  mine: (query?: PageQuery) =>
    apiRequest<ApiListResponse<SellerReport>>(`/api/reports/my${toQueryString(query)}`, {
      auth: true,
    }),
};

export const sellerApi = {
  shopProfile: () =>
    apiRequest<ApiItemResponse<SellerShopProfile>>("/api/seller/profile", { auth: true }),
  updateShopProfile: (payload: UpdateSellerShopPayload) =>
    apiRequest<ApiItemResponse<SellerShopProfile> & { message: string }>("/api/seller/profile", {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    }),
  stats: () => apiRequest<ApiItemResponse<SellerStats>>("/api/seller/stats", { auth: true }),
  reports: (months = 6) =>
    apiRequest<ApiItemResponse<SellerSalesReport>>(`/api/seller/reports?months=${months}`, { auth: true }),
};

export const adminApi = {
  sellerApplications: (query?: AdminApplicationQuery) =>
    apiRequest<ApiListResponse<SellerApplication>>(
      `/api/admin/sellers${toQueryString({
        ...query,
        status: query?.status === "ALL" ? undefined : query?.status,
      })}`,
      { auth: true }
    ),
  sellerApplication: (id: string) =>
    apiRequest<ApiItemResponse<SellerApplication>>(
      `/api/admin/sellers/${id}`,
      { auth: true }
    ),
  createUser: (payload: CreateUserPayload) =>
    apiRequest<ApiItemResponse<User> & { message: string }>("/api/admin/users", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    }),
  changeUserRole: (id: string, payload: { role: "BUYER" | "SELLER"; shopName?: string }) =>
    apiRequest<ApiItemResponse<User> & { message: string }>(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(payload),
    }),
  reports: (query?: AdminReportQuery) =>
    apiRequest<ApiListResponse<SellerReport>>(
      `/api/admin/reports${toQueryString({
        ...query,
        status: query?.status === "ALL" ? undefined : query?.status,
      })}`,
      { auth: true }
    ),
  reviewReport: (
    id: string,
    payload: { action: "warn" | "suspend" | "dismiss"; note?: string }
  ) =>
    apiRequest<ApiItemResponse<SellerReport>>(
      `/api/admin/reports/${id}/resolve`,
      {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
      }
    ),
  users: (query?: UserListQuery) =>
    apiRequest<ApiListResponse<User>>(`/api/admin/users${toQueryString(query)}`, {
      auth: true,
    }),
  banUser: (id: string, reason: string) =>
    apiRequest<ApiItemResponse<User>>(`/api/admin/users/${id}/ban`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ reason }),
    }),
  unbanUser: (id: string) =>
    apiRequest<ApiItemResponse<User>>(`/api/admin/users/${id}/unban`, {
      method: "PATCH",
      auth: true,
    }),
  products: (query?: AdminProductQuery) =>
    apiRequest<ApiListResponse<Product>>(
      `/api/admin/products${toQueryString({
        ...query,
        status: query?.status === "ALL" ? undefined : query?.status,
      })}`,
      { auth: true }
    ),
  hideProduct: (id: string, reason: string) =>
    apiRequest<ApiItemResponse<Product>>(`/api/admin/products/${id}/hide`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ reason }),
    }),
  removeProduct: (id: string, reason: string) =>
    apiRequest<ApiItemResponse<Product>>(`/api/admin/products/${id}`, {
      method: "DELETE",
      auth: true,
      body: JSON.stringify({ reason }),
    }),
  orders: (query?: PageQuery & { paymentStatus?: PaymentStatus; orderStatus?: OrderStatus }) =>
    apiRequest<ApiListResponse<Order>>(`/api/admin/orders${toQueryString(query)}`, {
      auth: true,
    }),
  confirmOrderPayment: (id: string) =>
    apiRequest<ApiItemResponse<Order>>(`/api/admin/orders/${id}/confirm-payment`, {
      method: "PATCH",
      auth: true,
    }),
  payoutOrder: (id: string) =>
    apiRequest<ApiItemResponse<Order>>(`/api/admin/orders/${id}/payout`, {
      method: "POST",
      auth: true,
    }),
  statsOverview: () =>
    apiRequest<ApiItemResponse<{
      total_users: number;
      total_sellers_approved: number;
      total_products: number;
      total_orders: number;
      gmv_total: number;
      pending_sellers_count: number;
      open_reports_count: number;
      platform_fees_total: number;
      pending_payout_total: number;
    }>>("/api/admin/stats/overview", { auth: true }),
  statsGrowth: (range: "week" | "month" = "week") =>
    apiRequest<{
      success: true;
      range: "week" | "month";
      data: { date: string; users_new: number; orders_new: number; gmv: number }[];
    }>(`/api/admin/stats/growth${toQueryString({ range })}`, { auth: true }),
};



