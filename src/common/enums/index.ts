/**
 * Enum definitions for the IRMS (Integrated Restaurant Management System).
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Each enum represents a single domain concept and its valid states.
 * - Centralizing enums here avoids duplication and ensures consistency.
 */

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SERVER = 'server',
  CHEF = 'chef',
  CASHIER = 'cashier',
  HOST = 'host',
}

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SEATED = 'seated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderItemStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  COOKING = 'cooking',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  DIGITAL = 'digital',
}
