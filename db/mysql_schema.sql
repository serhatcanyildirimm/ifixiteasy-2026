-- iFixItEasy - MySQL schema (DirectAdmin / phpMyAdmin)
-- Importeer dit bestand in phpMyAdmin op de database `ifixit_NEWDB`.
-- Dit is de MySQL-versie van server/db/migrations/*.sql (oorspronkelijk PostgreSQL).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS phones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(80) NOT NULL,
  model_name VARCHAR(120) NOT NULL,
  image_url TEXT,
  device_category VARCHAR(40) NOT NULL DEFAULT 'smartphone',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS issue_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS availability_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uniq_slot UNIQUE (slot_date, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  customer_email VARCHAR(160),
  phone_id INT NOT NULL,
  issue_type_id INT NOT NULL,
  notes TEXT,
  slot_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointment_phone FOREIGN KEY (phone_id) REFERENCES phones(id),
  CONSTRAINT fk_appointment_issue FOREIGN KEY (issue_type_id) REFERENCES issue_types(id),
  CONSTRAINT fk_appointment_slot FOREIGN KEY (slot_id) REFERENCES availability_slots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'admin',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Standaard reparatietypes (zoals 001_init.sql)
INSERT INTO issue_types (code, label, is_active) VALUES
  ('screen',   'Scherm kapot',        1),
  ('battery',  'Batterij snel leeg',  1),
  ('charging', 'Laadpoort probleem',  1),
  ('water',    'Waterschade',         1),
  ('camera',   'Camera probleem',     1)
ON DUPLICATE KEY UPDATE label = VALUES(label), is_active = VALUES(is_active);

-- Standaard admin-account.
-- E-mail:    admin@ifixiteasy.nl
-- Wachtwoord: Admin123!   (verander dit na de eerste login via het admin-panel)
INSERT INTO admin_users (email, password_hash, role, is_active) VALUES
  ('admin@ifixiteasy.nl', '$2b$10$mBL78qX2DHAsOqQHEmvYW.RAu2/nMXVD/HA8WfzsdAecwJLJ0R/.2', 'admin', 1)
ON DUPLICATE KEY UPDATE email = email;

SET FOREIGN_KEY_CHECKS = 1;
