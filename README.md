# IRMS Backend

NestJS backend for the Intelligent Restaurant Management System assignment. The application is structured as a modular monolith with feature modules for authentication, orders, kitchen display, tables, reservations, billing, inventory, dashboard, analytics, and administration.

## Main Capabilities

- JWT authentication and role-based access control.
- Staff-facing menu browsing and admin menu configuration.
- Order creation, order status updates, cancellation, and realtime KDS refresh through Server-Sent Events.
- Kitchen order display and order-item status updates.
- Table and reservation management with basic double-booking protection.
- Billing with payment status recording and split-bill calculation.
- Inventory item management and low-stock listing.
- JSON analytics for order status, top items, and daily revenue.
- Selected administrative activity logs.

## Environment

Create a `.env` file in this folder:

```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=irms
JWT_SECRET=replace-me
TAX_RATE=10
```

## Install

```bash
npm install
```

## Run

```bash
npm run start:dev
```

The API is served under:

```text
http://localhost:3000/api/v1
```

## Verification

```bash
npm run build
npm test
```

For the full backend check:

```bash
npm run verify
```

## Notes

Payment integration is intentionally limited to recording payment method and payment status. External card or digital wallet gateway processing is future work. The realtime event bus is in-process and best-effort; a durable queue or transaction outbox would be needed for production-grade delivery guarantees.
