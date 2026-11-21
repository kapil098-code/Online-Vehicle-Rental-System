# Online Vehicle Rental System

MCA 3rd Semester project: React + Vite frontend, Node.js + Express REST API, MySQL database.

## Setup

Requirements: Node.js 18+, MySQL 8+

### 1. Backend

```bash
cd backend
```

Copy `.env.example` to `.env` and fill in `DB_PASSWORD` and `JWT_SECRET`.

```bash
npm install
npm run setup
npm run dev
```

API runs at `http://localhost:5000`.

### 2. Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo Logins

Created by `npm run setup`:

- **Admin:** `admin@rental.com` / `Admin@123`
- **Customer:** `customer@rental.com` / `Customer@123`

Change demo credentials before using the application in a public production environment.

## Upgrading an Existing Database (ID Verification)

```bash
cd backend
npm run migrate
```

This adds the new user columns; existing users are marked Approved.

## Features

- ID verification: signup needs a Driving Licence / Aadhaar photo (stored privately); admin approves or rejects; only approved customers can book.
- Register / login (bcrypt + JWT), role-based access (customer, admin); role can never be set from the signup form.
- Search and filter vehicles: name, category, transmission, fuel, location, price range, and free-for-dates.
- Booking with a date-overlap check inside a database transaction (row lock) - no double booking.
- Server-side cost: total_cost = days x price_per_day.
- Payment placeholder: Cash on Pickup or Simulated Online.
- Customer dashboard with cancellation.
- Admin dashboard: stats, add/edit/remove vehicles, view/filter bookings, and update booking status.

## Folder Structure

```text
backend/
  server.js
  scripts/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/

frontend/
  src/
    components/
    context/
    pages/
    pages/admin/

database/
  schema.sql

docs/
  api-list.md
  er-and-dfd.md
```
