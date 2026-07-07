# Sabari API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

Most endpoints require a `Bearer` token in the `Authorization` header. Get a token via `POST /api/auth/login`.

```
Authorization: Bearer <token>
```

## Auth

### `POST /api/auth/register`
Register a new passenger account.

**Body:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required, unique)",
  "phone": "string (required)",
  "password": "string (required, min 6 chars)"
}
```

**Response `201`:** `{ message, token, user }`

---

### `POST /api/auth/login`
Login with email/password.

**Body:**
```json
{ "email": "string (required)", "password": "string (required)" }
```

**Response `200`:** `{ message, token, user }`

---

### `GET /api/auth/me`
Get current user profile. Requires auth.

**Response `200`:** `{ user }`

---

## Health

### `GET /api/health`
Server health check. No auth required.

**Response `200`:** `{ status: "ok", timestamp: "ISO date" }`

---

## Bookings

### `POST /api/bookings`
Create a new booking. Requires auth (passenger/company_admin).

**Body:**
```json
{
  "schedule": "ObjectId (required)",
  "route": "ObjectId (required)",
  "vehicle": "ObjectId (required)",
  "passengers": [{
    "name": "string (required)",
    "email": "string",
    "phone": "string",
    "seatNumber": "string (required)"
  }],
  "journeyDate": "ISO date (required)",
  "totalAmount": "number (required)",
  "paymentMethod": "string (required)"
}
```

**Response `201`:** `{ message, booking }`

---

### `GET /api/bookings`
List bookings. Requires auth. Filters: `?status=confirmed&date=2026-07-03&search=BOOK-ID`.

- **Passenger:** returns bookings where passenger email matches
- **Company admin:** returns bookings for their company
- **Super admin:** returns all bookings

**Response `200`:** `{ bookings }`

---

### `POST /api/bookings/[id]/cancel`
Cancel a booking and calculate refund. Requires auth (owner or company admin).

**Body:**
```json
{ "reason": "string (optional)" }
```

**Response `200`:** `{ success, refundAmount, refundPercentage, message }`

---

## Payments

### `GET /api/payments/methods`
List available payment gateways. No auth required.

**Response `200`:** `{ methods: [{ id, name, icon, sandbox }] }`

---

### `POST /api/payments/initiate`
Initiate a payment with a gateway. Requires auth.

**Body:**
```json
{
  "bookingId": "ObjectId (required)",
  "gateway": "string: esewa|khalti|fonepay|imepay|connectips (required)",
  "amount": "number (required)"
}
```

**Response `200`:** `{ transactionId, gateway, redirectUrl, formAction, formFields, token }`

---

### `POST /api/payments/verify`
Verify a payment callback. Requires auth.

**Body:**
```json
{
  "gateway": "string (required)",
  "transactionId": "string (required)",
  "gatewayParams": "object (optional)"
}
```

**Response `200`:** `{ message, payment, booking }`

---

### `POST /api/payments/callback/[gateway]`
Payment gateway callback/webhook. Public (no auth). Gateway-specific query/body params.

---

## Company Dashboard

### `GET /api/company/dashboard`
Dashboard statistics. Requires auth (company_admin/super_admin).

**Response `200`:** `{ totalVehicles, activeVehicles, totalDrivers, todaySchedules, todayBookings, todayRevenue, activeTrips, totalCounters }`

---

## Vehicles (Company)

### `GET /api/company/vehicles`
List company vehicles. Requires company_admin.

**Query params:** `?status=active&search=BA`

**Response `200`:** `{ vehicles }`

---

### `POST /api/company/vehicles`
Add a vehicle. Requires company_admin.

**Body:**
```json
{
  "vehicleNumber": "string (required, unique)",
  "type": "string: bus|deluxe-bus|ac-bus|tourist-bus|night-bus|sumo|hiace|jeep|ev-bus|electric-van|micro-bus (required)",
  "capacity": "number (required)",
  "brand": "string",
  "model": "string",
  "seatLayout": "string: 2x2|2x1|luxury|sleeper|hiace|sumo|custom"
}
```

**Response `201`:** `{ message, vehicle }`

---

### `GET/PUT/DELETE /api/company/vehicles/[id]`
Get, update, or delete a vehicle.

---

## Drivers (Company)

### `GET /api/company/drivers`
List company drivers. Requires company_admin.

**Query params:** `?status=available&search=name_or_phone`

**Response `200`:** `{ drivers }`

---

### `POST /api/company/drivers`
Add a driver. Requires company_admin.

**Body:**
```json
{
  "fullName": "string (required)",
  "phone": "string (required)",
  "licenseNumber": "string (required)",
  "email": "string",
  "status": "available|on_trip|on_break|offline"
}
```

**Response `201`:** `{ message, driver }`

---

### `GET/PUT/DELETE /api/company/drivers/[id]`
Get, update, or delete a driver.

---

## Schedules (Company)

### `GET /api/company/schedules`
List schedules. Requires company_admin. Paginated.

**Query params:** `?date=2026-07-03&route=ROUTE_ID&vehicle=VEH_ID&status=scheduled&page=1&limit=20&search=`

**Response `200`:** `{ schedules, total, page, totalPages }`

---

### `POST /api/company/schedules`
Create schedule. Requires company_admin.

**Body:**
```json
{
  "route": "ObjectId (required)",
  "vehicle": "ObjectId (required)",
  "departureTime": "HH:mm (required)",
  "arrivalTime": "HH:mm (required)",
  "fare": "number (required)",
  "date": "ISO date (required)"
}
```

**Response `201`:** `{ message, schedule }`

---

### `GET/PUT/DELETE /api/company/schedules/[id]`
Get, update, or delete a schedule.

---

## Routes (Company)

### `GET /api/company/routes`
List routes. Requires company_admin.

---

### `POST /api/company/routes`
Create route.

**Body:**
```json
{
  "name": "string",
  "from": "string (required)",
  "to": "string (required)",
  "distance": "number (required)",
  "estimatedDuration": "number (required, hours)",
  "stops": [{ "name": "string", "order": "number" }]
}
```

---

## Staff (Company)

### `GET/POST /api/company/staff`
### `GET/PUT/DELETE /api/company/staff/[id]`

---

## Counters (Company)

### `GET/POST /api/company/counters`
### `GET/PUT/DELETE /api/company/counters/[id]`

---

## Expenses (Company)

### `GET /api/company/expenses`
List expenses. Requires company_admin. Paginated.

**Query params:** `?type=fuel&from=ISO_DATE&to=ISO_DATE&vehicle=VEH_ID&page=1&limit=20`

**Response `200`:** `{ expenses, total, page, totalPages, summary: [{ _id: type, total, count }] }`

---

### `POST /api/company/expenses`
Record an expense. Requires company_admin.

**Body:**
```json
{
  "type": "string: fuel|maintenance|salary|toll|parking|food|other (required)",
  "amount": "number (required)",
  "description": "string",
  "date": "ISO date",
  "vehicle": "ObjectId"
}
```

**Response `201`:** `{ message, expense }`

---

### `DELETE /api/company/expenses/[id]`
Delete an expense. Requires company_admin.

---

## Reports (Company)

### `GET /api/company/reports`
Generate reports. Requires company_admin.

**Query params:**
- `type`: `daily-revenue` | `monthly-revenue` | `vehicle-income` | `driver-income` | `seat-occupancy` | `profit-loss`
- `from`: ISO date (default: 30 days ago)
- `to`: ISO date (default: today)

**Response `200`:** `{ data, type, from, to }`

---

## Parcels

### `POST /api/parcels`
Create a parcel. Requires auth.

**Body:**
```json
{
  "route": "ObjectId (required)",
  "sender": { "name": "string", "phone": "string", "address": "string" },
  "receiver": { "name": "string", "phone": "string", "address": "string" },
  "description": "string",
  "weight": "number (kg)",
  "amount": "number",
  "codAmount": "number"
}
```

**Response `201`:** `{ message, parcel }`

---

### `GET /api/parcels`
List parcels. Requires auth. Paginated.

**Query params:** `?status=pending&search=ID_OR_PHONE&page=1&limit=20`

**Response `200`:** `{ parcels, total, page, totalPages }`

---

### `PATCH /api/parcels/[id]/status`
Update parcel status with validated flow. Requires auth.

**Body:**
```json
{ "status": "string (see Parcel model)", "note": "string", "location": "string" }
```

---

### `GET /api/parcels/track/[trackingId]`
Public parcel tracking. No auth required.

**Response `200`:** `{ parcel }` (populated with route and company)

---

## Notifications

### `GET /api/notifications`
List notifications. Requires auth.

**Query params:** `?limit=20&skip=0&unread=true`

**Response `200`:** `{ notifications, total, unreadCount }`

---

### `GET /api/notifications/unread-count`
Get unread notification count. Requires auth.

**Response `200`:** `{ count }`

---

### `PUT /api/notifications/[id]/read`
Mark notification as read. Requires auth (must be recipient).

**Response `200`:** `{ notification }`

---

### `POST /api/notifications`
Create and send a notification. Requires auth.

**Body:**
```json
{
  "title": "string (required)",
  "message": "string (required)",
  "type": "string: bus_started|bus_delayed|bus_reached|seat_confirmed|payment_success|vehicle_near|trip_completed|vehicle_started|vehicle_delayed|seat_sold|vehicle_arrived|vehicle_cancelled|driver_changed|emergency|system",
  "recipient": "ObjectId (defaults to current user)",
  "channels": { "sms": false, "email": false, "push": false, "inApp": true }
}
```

---

## Trips

### `POST /api/trips/start`
Start a trip. Requires auth (driver/company_admin).

**Body:**
```json
{
  "schedule": "ObjectId (required)",
  "vehicle": "ObjectId (required)",
  "driver": "ObjectId (required)",
  "odometerStart": "number"
}
```

---

### `POST /api/trips/[id]/end`
End a trip. Requires auth.

**Body:**
```json
{ "odometerEnd": "number", "notes": "string" }
```

---

## GPS

### `POST /api/gps/location`
Update vehicle GPS location. Sent by driver mobile app.

---

### `GET /api/gps/active`
Get all active vehicle locations.

---

### `GET /api/gps/vehicle/[id]/latest`
Get latest GPS location for a specific vehicle.

---

## Counter Portal

### `GET /api/counter/dashboard`
Counter dashboard stats.

### `GET/POST /api/counter/bookings`
Counter booking management.

### `GET /api/counter/bookings/history/[phone]`
Lookup passenger booking history by phone.

### `GET /api/counter/passengers/search`
Search passengers.

### `PUT /api/counter/bookings/[id]/change-date`
Change booking date.

### `PUT /api/counter/bookings/[id]/transfer`
Transfer booking to another schedule.

---

## Admin

### `GET/POST /api/admin/companies`
Manage companies. Super admin only.

### `GET/POST /api/admin/routes`
Manage global routes.

### `GET/POST /api/admin/districts`, `/api/admin/municipalities`
Manage districts and municipalities.

### `GET/POST /api/admin/plans`
Manage subscription plans.

### `GET/POST /api/admin/users`
Manage all users.

### `GET /api/admin/dashboard`
Admin dashboard stats (super admin).

### `GET/POST /api/admin/settings`
Application settings.

### `POST /api/admin/settings/sms/test`, `/api/admin/settings/email/test`
Test SMS/email configuration.

### `GET /api/admin/refunds`
List cancelled/refunded bookings. Paginated. Filters: `?status=pending|refunded|none&search=`

### `POST /api/admin/refunds/process`
Manually process a refund.

**Body:**
```json
{
  "bookingId": "ObjectId (required)",
  "amount": "number (optional, defaults to refundAmount or totalAmount)",
  "reason": "string (optional)"
}
```

### `GET/POST /api/admin/commissions`
Manage ticket commissions.

---

## Auth & Permissions

| Role | Scope |
|---|---|
| `super_admin` | Full access to all admin endpoints |
| `company_admin` | Company-scoped CRUD (vehicles, drivers, schedules, bookings, expenses) |
| `counter_operator` | Counter-scoped bookings, parcels |
| `driver` | GPS updates, trip start/end |
| `passenger` | Own bookings, profile |
