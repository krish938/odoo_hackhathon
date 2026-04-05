-- Admin user (password: Admin@1234)
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin User', 'admin@pos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGmiIOgWkssqoOj.hGRRfm5aXK2', 'admin');

-- 500 additional staff/manager users are bulk-seeded via: node Backend/seed_500_users.js
-- All seeded users use password: Staff@1234 (bcrypt $2b$12 hash)
-- Roles: ~75% staff, ~25% manager, realistic Indian names

-- Categories
INSERT INTO categories (name, send_to_kitchen) VALUES
('Food', true), ('Beverages', false), ('Desserts', true);

-- Products
INSERT INTO products (name, category_id, base_price, unit, tax, description, send_to_kitchen) VALUES
('Margherita Pizza', 1, 280.00, 'plate', 5, 'Classic tomato and mozzarella', true),
('Pasta Alfredo', 1, 220.00, 'plate', 5, 'Creamy white sauce pasta', true),
('Veggie Burger', 1, 150.00, 'piece', 5, 'Grilled veggie patty', true),
('Cold Coffee', 2, 120.00, 'glass', 0, 'Chilled coffee with ice cream', false),
('Fresh Lime Soda', 2, 80.00, 'glass', 0, 'Refreshing lime soda', false),
('Mineral Water', 2, 40.00, 'bottle', 0, 'Still water 500ml', false),
('Chocolate Brownie', 3, 90.00, 'piece', 0, 'Warm chocolate brownie', true),
('Gulab Jamun', 3, 60.00, 'piece', 0, '2 pieces with sugar syrup', false);

-- Attributes
INSERT INTO attributes (name) VALUES ('Size'), ('Add-ons');
INSERT INTO attribute_values (attribute_id, value, extra_price) VALUES
(1, 'Small', 0), (1, 'Medium', 40), (1, 'Large', 80),
(2, 'Extra Cheese', 30), (2, 'Extra Sauce', 20);

-- Payment Methods
INSERT INTO payment_methods (name, type, is_enabled, upi_id) VALUES
('Cash', 'CASH', true, null),
('Card / Bank', 'DIGITAL', true, null),
('UPI', 'UPI', true, '123@ybl.com');

-- Floors
INSERT INTO floors (name) VALUES ('Ground Floor'), ('First Floor');

-- Tables
INSERT INTO tables (floor_id, table_number, seats, is_active) VALUES
(1, 'T1', 4, true), (1, 'T2', 2, true), (1, 'T3', 6, true),
(1, 'T4', 4, true), (1, 'T5', 2, true), (1, 'T6', 8, true),
(2, 'T7', 4, true), (2, 'T8', 4, true), (2, 'T9', 2, true);

-- POS Terminal
INSERT INTO pos_terminals (name) VALUES ('Main Counter'), ('Bar Counter');
