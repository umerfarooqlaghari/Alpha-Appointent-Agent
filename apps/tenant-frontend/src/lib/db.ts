export function decodeTenantId(tenantId: string) {
  try {
    return decodeURIComponent(tenantId);
  } catch {
    return tenantId;
  }
}

export type Tenant = {
  tenant_id: string;
  name: string;
  status: string;
  created_at: Date;
};

export type TenantConfig = {
  tenant_id: string;
  adapter_type: "postgres" | "shopify" | "pos-http";
  industry_type: string | null;
  api_base_url: string | null;
  auth_header_name: string | null;
  auth_token: string | null;
  products_api_url: string | null;
  inventory_source: "database" | "webhook";
  publishable_key: string | null;
  allowed_domains: string | null;
  disabled_tabs?: string;
};

export type InventoryItem = {
  id: string;
  tenant_id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  price: number;
  stock_status: "in_stock" | "out_of_stock";
  variations: unknown[];
  custom_variables: Record<string, unknown>;
  is_disabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export type AvailabilitySlot = {
  slot_id: string;
  tenant_id: string;
  slot_start: Date;
  slot_end: Date;
  is_booked: boolean;
  appointment_id: string | null;
};

export type Appointment = {
  appointment_id: string;
  tenant_id: string;
  customer_name: string;
  customer_phone: string;
  service: string;
  start_time: Date;
  end_time: Date;
  status: "booked" | "cancelled" | "rescheduled";
  notes: string | null;
  created_at: Date;
};

export type Faq = {
  id: string;
  tenant_id: string;
  question: string;
  answer: string;
  created_at: Date;
  updated_at: Date;
};

export type RestaurantOrder = {
  orderId: string;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  orderType: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  id: string;
  orderId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
};