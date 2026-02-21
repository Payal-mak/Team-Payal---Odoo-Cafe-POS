-- Active: 1771230435099@@localhost@3306@odoo_cafe_pos
-- Run this migration to add floor_plan_enabled to pos_terminals
-- Apply once via phpMyAdmin or mysql CLI:
--   mysql -u root -p odoo_cafe_pos < database/add_settings_fields.sql

ALTER TABLE pos_terminals
ADD COLUMN IF NOT EXISTS floor_plan_enabled BOOLEAN NOT NULL DEFAULT FALSE;