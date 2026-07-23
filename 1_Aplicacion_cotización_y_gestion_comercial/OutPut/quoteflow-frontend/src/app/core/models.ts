export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: SessionUser;
}

export interface DashboardMetrics {
  totalQuotes: number;
  totalQuotedValue: number;
  acceptedValue: number;
  conversionRate: number;
  pendingApprovals: number;
  recentActivity: ActivityEntry[];
}

export interface ActivityEntry {
  title: string;
  detail: string;
  status: string;
  date: string;
}

export interface Client {
  id: number;
  identification: string;
  businessName: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  taxCondition: string;
  status: string;
  totalQuoted: number;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  tax: number;
  type: string;
  status: string;
}

export interface PriceList {
  id: number;
  name: string;
  segment: string;
  validFrom: string;
  validTo: string;
  maxDiscount: number;
  status: string;
}

export interface QuoteItem {
  productId: number;
  code: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface QuoteStatusEntry {
  status: string;
  date: string;
  user: string;
  comment: string;
}

export interface Quote {
  id: number;
  number: string;
  clientId: number;
  client: string;
  advisorId: number;
  advisor: string;
  currency: string;
  validUntil: string;
  priceListId: number | null;
  priceListName: string | null;
  discount: number;
  subtotal: number;
  taxes: number;
  total: number;
  paymentTerms: string;
  deliveryTime: string;
  notes: string;
  status: string;
  items: QuoteItem[];
  statusHistory: QuoteStatusEntry[];
  createdAt: string;
}

export interface ClientDetail {
  client: Client;
  quoteHistory: Quote[];
}

export interface CreateQuoteItemRequest {
  productId: number;
  quantity: number;
  discount: number;
}

export interface CreateQuoteRequest {
  clientId: number;
  currency: string;
  validUntil: string;
  priceListId: number | null;
  discount: number;
  paymentTerms: string;
  deliveryTime: string;
  notes: string;
  sendForApproval: boolean;
  items: CreateQuoteItemRequest[];
}