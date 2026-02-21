USE odoo_cafe_pos;

-- The previous "CREATE TABLE IF NOT EXISTS payments" command silently failed because the older `payments` table already existed.
-- We must explicitly ALTER the existing table to swap out the legacy 'payment_method' enum for the new structured IDs.

ALTER TABLE payments
-- Drop the old column
DROP COLUMN payment_method;

ALTER TABLE payments
-- Add the new columns you requested
ADD COLUMN payment_method_id INT NOT NULL DEFAULT 1 AFTER order_id,
ADD COLUMN payment_type ENUM('cash', 'card', 'upi') NOT NULL DEFAULT 'cash' AFTER payment_method_id;