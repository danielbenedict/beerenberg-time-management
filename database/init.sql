CREATE DATABASE IF NOT EXISTS beerenberg_db;
USE beerenberg_db;

-- Core Users / Staff Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    pin_code_hash VARCHAR(255) NOT NULL,
    role ENUM('WORKER', 'SUPERVISOR', 'ROSTER_ADMIN', 'OFFICE_ADMIN') NOT NULL DEFAULT 'WORKER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clocking Events Table
CREATE TABLE IF NOT EXISTS clock_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_type ENUM('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END') NOT NULL,
    verification_method ENUM('PIN', 'QR', 'WEBCAM_MOCK') NOT NULL DEFAULT 'PIN',
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Audit Trail Logging Table (7-Year Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    performed_by INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    override_reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES users(user_id)
);