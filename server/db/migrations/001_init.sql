CREATE TABLE IF NOT EXISTS phones (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand VARCHAR(80) NOT NULL,
  model_name VARCHAR(120) NOT NULL,
  image_url TEXT,
  device_category VARCHAR(40) NOT NULL DEFAULT 'smartphone',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_types (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uniq_slot UNIQUE (slot_date, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  customer_email VARCHAR(160),
  phone_id INTEGER NOT NULL,
  issue_type_id INTEGER NOT NULL,
  notes TEXT,
  slot_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phones(id),
  FOREIGN KEY (issue_type_id) REFERENCES issue_types(id),
  FOREIGN KEY (slot_id) REFERENCES availability_slots(id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO issue_types (code, label, is_active)
VALUES
  ('screen', 'Scherm kapot', TRUE),
  ('battery', 'Batterij snel leeg', TRUE),
  ('charging', 'Laadpoort probleem', TRUE),
  ('water', 'Waterschade', TRUE),
  ('camera', 'Camera probleem', TRUE)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  is_active = EXCLUDED.is_active;
