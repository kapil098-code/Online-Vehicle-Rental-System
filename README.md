# Online Vehicle Rental System

MCA 3rd Semester project: React + Vite frontend, Node.js + Express REST API, MySQL database.

## Setup

Requirements: Node.js 18+, MySQL 8+

1. Backend
   cd backend
   copy .env.example to .env and fill in DB_PASSWORD and JWT_SECRET
   npm install
   npm run setup      (creates database, tables and demo data)
   npm run dev        (API on http://localhost:5000)

2. Frontend (new terminal)
   cd frontend
   npm install
   npm run dev        (open http://localhost:5173)

Demo logins (created by npm run setup)
- Admin:    admin@rental.com    / Admin@123
- Customer: customer@rental.com / Customer@123

## Upgrading an existing database (ID verification)
   cd backend
   npm run migrate   (adds the new user columns; existing users are marked Approved)

## Features
- ID verification: signup needs a Driving Licence / Aadhaar photo (stored privately); admin approves or rejects; only approved customers can book
- Register / login (bcrypt + JWT), role-based access (customer, admin); role can never be set from the signup form
- Search and filter vehicles: name, category, transmission, fuel, location, price range, and free-for-dates
- Booking with a date-overlap check inside a database transaction (row lock) - no double booking
- Server-side cost: total_cost = days x price_per_day
- Payment placeholder: Cash on Pickup or Simulated Online (amount taken from the booking, not the client)
- Customer dashboard with cancellation (blocked within 24 hours of start; paid bookings become Refunded)
- Admin: stats, add/edit/remove vehicles (image upload, soft delete, blocked if active bookings),
  view/filter all bookings, update booking status (Pending, Confirmed, Ongoing, Completed, Cancelled)

## Folder structure
backend/   server.js, scripts/setup.js, src/{config,controllers,middleware,models,routes,utils}
frontend/  src/{components,context,pages,pages/admin}
database/  schema.sql
docs/      api-list.md, er-and-dfd.md
