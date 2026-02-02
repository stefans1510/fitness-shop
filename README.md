# Fitness Shop — Fitness Equipment E-Commerce

Full-stack e-commerce web application for selling fitness equipment, built with **ASP.NET Core Web API** + **Angular**.  
Includes **role-based authorization** (Customer / Company / Admin), **Redis** shopping cart, **Stripe** payments, **coupon system**, **inventory reservation/commit** to prevent overselling, and **SignalR** real-time notifications.

Repository: https://github.com/stefans1510/fitness-shop

---

## Tech Stack

### Backend
- **ASP.NET Core Web API** (.NET 8)
- **Entity Framework Core** + **SQL Server**
- **ASP.NET Core Identity** + **Roles** (Customer, Company, Admin)
- **Redis** via **StackExchange.Redis** (cart persistence)
- **Stripe** (.NET SDK) — PaymentIntents + refunds
- **SignalR** — WebSocket real-time notifications
- **Repository + Unit of Work** pattern, Specifications

### Frontend
- **Angular** (Signals)
- **Angular Material**
- **Tailwind CSS**
- **RxJS**

---

## Key Features

### Authentication & Role-Based Authorization (Identity)
- Register/login with **ASP.NET Core Identity**
- Roles:
  - **Customer** — regular users
  - **Company** — company users (B2B pricing)
  - **Admin**
- User profile endpoints: user info, address create/update, change password, logout

### Company Pricing
- **Company users receive automatic 15% discount**
- Server validates cart item prices to ensure pricing cannot be manipulated client-side

### Product Catalog
- Products stored in **SQL Server** and served through REST endpoints
- Seed data supported (products + delivery methods from JSON)

### Shopping Cart (Redis)
- Cart stored in **Redis** as JSON with **30-day TTL**
- Add/update/remove items, persist cart between sessions

### Orders
- Create order from cart (order items, shipping method, address, subtotal/discount)
- Users can list their orders and fetch order details by id

### Inventory Tracking (Anti-Oversell Flow)
- Stock is **reserved** before order creation (using PaymentIntent id as reservation id)
- Reserved stock is **committed** after successful payment, or **released** on failure/expiration

### Coupons / Discount Codes
- Internal coupon system:
  - Percentage or fixed amount discounts
  - Validity period, usage limits, minimum order amount, optional max discount
  - Tracks coupon usage per user and per order (each user can redeem a coupon only once)
- Applied during checkout and persisted on the order

### Payments (Stripe)
- Create/update **PaymentIntent** based on:
  - cart subtotal
  - shipping price
  - optional coupon discount
- Prevents totals falling below Stripe minimum charge
- Supports **refunds**
- Payment confirmation finalizes the order and inventory (webhook-driven flow)

### Real-Time Notifications (SignalR)
- SignalR hub sends **OrderCompleteNotification** to the authenticated user when payment is confirmed
- Angular client opens hub connection after login and updates UI on notifications

### Admin Functionality
- Admin UI for **coupon management** (list/create/edit/activate/deactivate/delete)
- Admin user can be seeded via env vars:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

---

## Project Structure

- `API/` — ASP.NET Core Web API (controllers, endpoints, SignalR hub)
- `Core/` — domain entities, interfaces, specifications
- `Infrastructure/` — EF Core DbContext, services (payments, cart, coupons, inventory), seed data
- `client/` — Angular app (catalog, cart, checkout, profile, admin dashboard)

---

## Getting Started (Local)

### Prerequisites
- **.NET 8 SDK**
- **Node.js + npm**
- **SQL Server**
- **Redis**

### Environment Variables
Set these as environment variables (or via your preferred secret manager):

- `DefaultConnection` — SQL Server connection string
- `Redis` — Redis connection string
- `StripeSettings:SecretKey` — Stripe secret key
- `StripeSettings:PublicKey` — Stripe publishable key (frontend)
- `ADMIN_EMAIL` — optional, seeds admin user
- `ADMIN_PASSWORD` — optional, seeds admin user

### Run Backend (API)
```bash
cd API
dotnet restore
dotnet ef database update
dotnet run
```
### Run Frontend (Angular)
```bash
cd client
npm install
npm start
```
