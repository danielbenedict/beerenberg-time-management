#DROP DATABASE IF EXISTS beerenberg_db;

CREATE DATABASE beerenberg_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE beerenberg_db;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3. Users / Staff Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_id INT NULL,
    role_id INT NULL,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NULL UNIQUE,
    password_hash VARCHAR(255) NULL,   -- NULL for staff using kiosk PIN only
    pin_code VARCHAR(255) NOT NULL,      -- Hashed PIN for Time Station Kiosk
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL,
    INDEX idx_users_dept (dept_id),
    INDEX idx_users_role (role_id)
) ENGINE=InnoDB;

-- 4. Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    contract_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contract_type ENUM('Full-Time', 'Part-Time', 'Casual') NOT NULL,
    weekly_max_hours DECIMAL(5,2) NOT NULL DEFAULT 38.00,
    hourly_rate DECIMAL(10,4) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    CONSTRAINT fk_contracts_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_contract_dates CHECK (end_date IS NULL OR end_date >= start_date),
    INDEX idx_contracts_user_date (user_id, start_date, end_date)
) ENGINE=InnoDB;

-- 5. Time Station Kiosks
CREATE TABLE IF NOT EXISTS kiosks (
    kiosk_id INT AUTO_INCREMENT PRIMARY KEY,
    kiosk_name VARCHAR(100) NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- 6. Shift Rosters
CREATE TABLE IF NOT EXISTS roster_shifts (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_by INT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    planned_break_mins INT NOT NULL DEFAULT 30,
    status ENUM('SCHEDULED', 'COMPLETED', 'MISSED', 'OVERRIDDEN') NOT NULL DEFAULT 'SCHEDULED',
    CONSTRAINT fk_roster_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_roster_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_roster_times CHECK (end_time > start_time AND planned_break_mins >= 0),
    INDEX idx_roster_user_time (user_id, start_time, end_time)
) ENGINE=InnoDB;

-- 7. Clock Events
CREATE TABLE IF NOT EXISTS clock_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    kiosk_id INT NULL,
    event_type ENUM('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END') NOT NULL,
    event_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verification_method ENUM('PIN', 'QR_CODE', 'WEBCAM_MOCK') NOT NULL,
    photo_reference_url VARCHAR(255) NULL,
    is_manual_entry BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_clock_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_clock_kiosk FOREIGN KEY (kiosk_id) REFERENCES kiosks(kiosk_id) ON DELETE SET NULL,
    INDEX idx_clock_user_timestamp (user_id, event_timestamp)
) ENGINE=InnoDB;

USE beerenberg_db;

ALTER TABLE clock_events 
ADD COLUMN break_reason VARCHAR(100) NULL AFTER verification_method;
SELECT * FROM clock_events;

ALTER TABLE clock_events 
MODIFY COLUMN verification_method VARCHAR(50) NOT NULL DEFAULT 'PIN';


-- 8. Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    performed_by INT NULL,
    action_type ENUM('INSERT', 'UPDATE', 'DELETE', 'SUPERVISOR_OVERRIDE') NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    override_reason TEXT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_performer FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_audit_entity (entity_name, entity_id),
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB;

-- Initial Seed Data for System Roles
INSERT INTO roles (role_name) VALUES 
    ('Office Admin'), 
    ('Roster Admin'), 
    ('Supervisor'), 
    ('Staff');

-- Initial Seed Data for Departments
INSERT INTO departments (dept_name) VALUES 
    ('Factory Operations'), 
    ('Office & HR'), 
    ('Logistics & Warehouse');
    
    USE beerenberg_db;

-- Insert an Office Admin (Email: admin@beerenberg.com.au, Password: adminpassword)
INSERT INTO users (dept_id, role_id, employee_code, first_name, last_name, email, password_hash, pin_code, is_active)
VALUES (
  2, 
  1, 
  'ADM001', 
  'Office', 
  'Admin', 
  'admin@beerenberg.com.au', 
  '$2a$10$76T48qOnk0aE98h8xV/N/e5VInI2Xf29eXf.6d/5A95WvU7L3N1A6', 
  '$2a$10$76T48qOnk0aE98h8xV/N/e5VInI2Xf29eXf.6d/5A95WvU7L3N1A6', 
  TRUE
);

USE beerenberg_db;

CREATE TABLE IF NOT EXISTS roster_shifts (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_mins INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

USE beerenberg_db;

-- Drop existing table to ensure column alignment
DROP TABLE IF EXISTS roster_shifts;

-- Re-create roster_shifts with explicit shift_date, start_time, and end_time
CREATE TABLE roster_shifts (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_mins INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

USE beerenberg_db;

-- 1. Add the pin column to the users table
ALTER TABLE users ADD COLUMN pin VARCHAR(10) DEFAULT '1234';

-- 2. Set default PINs for John Doe and Sarah Connor
UPDATE users SET pin = '1234' WHERE employee_code = 'EMP001';
UPDATE users SET pin = '1234' WHERE employee_code = 'EMP002';

USE beerenberg_db;



SELECT * FROM clock_events;

USE beerenberg_db;

-- Insert default time stations if not present
INSERT IGNORE INTO kiosks (kiosk_id, kiosk_name, location_name, api_key_hash, is_active) VALUES
(1, 'Hahndorf Factory Entrance Kiosk #01', 'Hahndorf Factory', 'hash_mock_key_1', 1),
(2, 'Packaging Line Station #02', 'Packaging Hall', 'hash_mock_key_2', 1),
(3, 'Farm Operations Kiosk #03', 'Farm Entrance', 'hash_mock_key_3', 1);


USE beerenberg_db;

CREATE TABLE IF NOT EXISTS temp_pins (
  temp_pin_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pin VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

USE beerenberg_db;

SELECT tp.temp_pin_id, tp.user_id, tp.pin, tp.expires_at, tp.created_at, u.first_name, u.last_name
FROM temp_pins tp
JOIN users u ON tp.user_id = u.user_id
ORDER BY tp.temp_pin_id DESC;

USE beerenberg_db;

SELECT ce.event_id, ce.user_id, ce.kiosk_id, ce.event_type, ce.verification_method, ce.event_timestamp, u.first_name, u.last_name
FROM clock_events ce
JOIN users u ON ce.user_id = u.user_id
ORDER BY ce.event_id DESC;


USE beerenberg_db;

SELECT user_id, employee_code, first_name, last_name, pin, is_active 
FROM users;

USE beerenberg_db;

UPDATE users SET pin = '1234', pin_code = '1234' WHERE user_id = 1; -- Admin
UPDATE users SET pin = '2222', pin_code = '2222' WHERE user_id = 2; -- Sarah
UPDATE users SET pin = '3333', pin_code = '3333' WHERE user_id = 3; -- Daniel
UPDATE users SET pin = '4444', pin_code = '4444' WHERE user_id = 4; -- Sanjay
UPDATE users SET pin = '5555', pin_code = '5555' WHERE user_id = 5; -- Hasitha
UPDATE users SET pin = '6666', pin_code = '6666' WHERE user_id = 6; -- Jaya
UPDATE users SET employee_code = 'EMP004' WHERE user_id = 4; 
SELECT user_id, employee_code, first_name, last_name, pin, is_active FROM users;


USE beerenberg_db;

SELECT event_id, user_id, event_type, break_reason, event_timestamp 
FROM clock_events 
WHERE user_id = 3 
ORDER BY event_timestamp DESC 
LIMIT 5;

SELECT * FROM clock_events ORDER BY event_timestamp DESC LIMIT 10;

SELECT user_id, employee_code, first_name, last_name, pin 
FROM users 
WHERE is_active = 1;
INSERT INTO clock_events (user_id, kiosk_id, event_type, verification_method, event_timestamp)
VALUES (4, 1, 'CLOCK_IN', 'PIN', NOW() - INTERVAL 5 HOUR);
-- 1. Insert a CLOCK_IN event set to 5 hours ago


SELECT 
    u.user_id,
    u.employee_code,
    u.first_name,
    u.last_name,
    u.pin,
    r.role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
WHERE u.is_active = 1 
  AND (
      LOWER(r.role_name) LIKE '%admin%' 
      OR LOWER(r.role_name) LIKE '%supervisor%' 
      OR LOWER(r.role_name) LIKE '%manager%'
  );



SELECT event_id, user_id, event_type, verification_method, break_reason, event_timestamp, is_manual_entry
FROM clock_events
ORDER BY event_id DESC
LIMIT 5;

SELECT user_id, employee_code, first_name, last_name FROM users WHERE employee_code = 'EMP008';