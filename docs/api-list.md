# API List  (base URL: /api)

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | /auth/register | Public | Create customer account (multipart: ID type, ID number, ID photo) |
| POST | /auth/login | Public | Login, returns JWT |
| GET | /auth/me | Logged in | Current user + verification status |
| PUT | /auth/documents | Customer | Re-upload ID after rejection |
| GET | /vehicles | Public | List/search (q, category, transmission, fuel, location, minPrice, maxPrice, startDate, endDate) |
| GET | /vehicles/:id | Public | Vehicle details + booked date ranges |
| POST | /bookings | Customer | Create booking (overlap check, server-side cost) |
| GET | /bookings/my | Customer | My bookings |
| PUT | /bookings/:id/cancel | Owner | Cancel (24-hour policy) |
| POST | /payments | Customer | Pay for a Pending booking, confirms it |
| GET | /admin/stats | Admin | Dashboard statistics |
| POST | /admin/vehicles | Admin | Add vehicle (multipart, image) |
| PUT | /admin/vehicles/:id | Admin | Edit vehicle |
| DELETE | /admin/vehicles/:id | Admin | Soft-delete vehicle |
| GET | /admin/bookings | Admin | All bookings (status, from, to) |
| PUT | /admin/bookings/:id/status | Admin | Update booking status |
| GET | /admin/users | Admin | List customers (status filter) |
| GET | /admin/users/:id/document | Admin | View a customer's ID photo (private) |
| PUT | /admin/users/:id/verification | Admin | Approve or reject (reason required) |
