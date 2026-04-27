export const INTERNAL_EVENTS = {
  ORDER_CREATED_FOR_KDS: 'orders.created.for_kds',
  ORDER_STATUS_UPDATED: 'orders.status_updated',
} as const;

export interface OrderCreatedForKdsEvent {
  order_id: string;
  table_id: string;
  server_id: string | null;
  created_at: Date;
  items: Array<{
    order_item_id: string;
    menu_item_id: string;
    quantity: number;
    notes: string | null;
  }>;
}

export interface KdsOrderNotification extends OrderCreatedForKdsEvent {
  received_at: Date;
}

export interface OrderStatusUpdatedEvent {
  order_id: string;
  status: string;
  updated_at: Date;
}
