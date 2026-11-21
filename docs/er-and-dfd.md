# ER Diagram (text)
USER (user_id PK, name, email UK, phone, password_hash, role, id_type, id_number, id_document, verification_status, verification_remark, created_at)
VEHICLE (vehicle_id PK, name, category, model, transmission_type, fuel_type, price_per_day, location, status, image_url, is_active)
BOOKING (booking_id PK, user_id FK, vehicle_id FK, start_date, end_date, total_cost, booking_status, created_at)
PAYMENT (payment_id PK, booking_id FK UK, amount, payment_method, payment_status, transaction_id, payment_date)

USER 1 --- M BOOKING        VEHICLE 1 --- M BOOKING        BOOKING 1 --- 1 PAYMENT

# DFD Level 0
Customer <-> [Online Vehicle Rental System] <-> Admin      (data store: MySQL database)

# DFD Level 1 processes
1 Authentication | 2 Vehicle Search | 3 Booking | 4 Payment | 5 Fleet Management | 6 Booking Oversight

# DFD Level 2 (Booking)
3.1 Receive request -> 3.2 Validate dates -> 3.3 Check availability (overlap) -> 3.4 Calculate cost -> 3.5 Save booking -> 3.6 Confirm to user
