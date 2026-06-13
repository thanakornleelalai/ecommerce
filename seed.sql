-- seed.sql
-- Sample data for the ecommerce database.
-- Run after schema.sql:  mysql -u root -P 3307 ecommerce < seed.sql

USE ecommerce;

INSERT INTO customers (name, email) VALUES
  ('Alice Johnson', 'alice@example.com'),
  ('Bob Smith',     'bob@example.com'),
  ('Carol White',   'carol@example.com');

INSERT INTO products (name, price, stock) VALUES
  ('Wireless Mouse',      24.99, 100),
  ('Mechanical Keyboard', 79.50,  40),
  ('27" Monitor',        199.00,  15),
  ('USB-C Hub',           34.95,  60),
  ('Laptop Stand',        29.99,  25);

-- Example order for Alice: 1 keyboard + 2 mice.
INSERT INTO orders (customer_id, total, status) VALUES
  (1, 129.48, 'paid');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
  (1, 2, 1, 79.50),
  (1, 1, 2, 24.99);

-- Reflect the sample order in stock levels.
UPDATE products SET stock = stock - 1 WHERE id = 2;
UPDATE products SET stock = stock - 2 WHERE id = 1;
