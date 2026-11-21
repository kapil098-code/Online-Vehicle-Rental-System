-- Online Vehicle Rental System : MySQL 8+ schema
CREATE DATABASE IF NOT EXISTS vehicle_rental_db;
USE vehicle_rental_db;

CREATE TABLE IF NOT EXISTS users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    phone         VARCHAR(20)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    id_type       ENUM('Driving Licence','Aadhaar Card') NULL,
    id_number     VARCHAR(30) NULL,
    id_document   VARCHAR(255) NULL,
    verification_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    verification_remark VARCHAR(255) NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id        INT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    category          ENUM('Car','Bike','SUV','Van') NOT NULL,
    model             VARCHAR(50)  NOT NULL,
    transmission_type ENUM('Manual','Automatic') NOT NULL DEFAULT 'Manual',
    fuel_type         ENUM('Petrol','Diesel','Electric','CNG') NOT NULL DEFAULT 'Petrol',
    price_per_day     DECIMAL(10,2) NOT NULL CHECK (price_per_day > 0),
    location          VARCHAR(100) NOT NULL,
    status            ENUM('Available','Booked','Under Maintenance') NOT NULL DEFAULT 'Available',
    image_url         VARCHAR(255),
    is_active         TINYINT(1) NOT NULL DEFAULT 1,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vehicle_filter (category, location, price_per_day)
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    vehicle_id     INT NOT NULL,
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    total_cost     DECIMAL(10,2) NOT NULL,
    booking_status ENUM('Pending','Confirmed','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)       ON DELETE RESTRICT,
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
    CONSTRAINT chk_dates CHECK (end_date > start_date),
    INDEX idx_booking_overlap (vehicle_id, start_date, end_date)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id     INT AUTO_INCREMENT PRIMARY KEY,
    booking_id     INT NOT NULL UNIQUE,
    amount         DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash on Pickup','Simulated Online') NOT NULL,
    payment_status ENUM('Pending','Paid','Refunded') NOT NULL DEFAULT 'Pending',
    transaction_id VARCHAR(100),
    payment_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);
