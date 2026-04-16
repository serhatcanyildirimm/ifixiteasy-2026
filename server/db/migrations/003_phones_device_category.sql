ALTER TABLE phones
ADD COLUMN device_category VARCHAR(32) NOT NULL DEFAULT 'smartphone' AFTER model_name;
