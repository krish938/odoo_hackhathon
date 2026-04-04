-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL CHECK (length(password_hash) >= 60),
  role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin','staff','manager')),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES & PRODUCTS
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  send_to_kitchen BOOLEAN DEFAULT FALSE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id INT REFERENCES categories(id),
  base_price NUMERIC(10,2) NOT NULL,
  unit VARCHAR(50),
  tax NUMERIC(5,2),
  description TEXT,
  send_to_kitchen BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCT ATTRIBUTES
CREATE TABLE attributes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE attribute_values (
  id SERIAL PRIMARY KEY,
  attribute_id INT REFERENCES attributes(id) ON DELETE CASCADE,
  value VARCHAR(100),
  extra_price NUMERIC(10,2) DEFAULT 0
);

-- PAYMENT METHODS
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  type VARCHAR(50) CHECK (type IN ('CASH','DIGITAL','UPI')),
  is_enabled BOOLEAN DEFAULT TRUE,
  upi_id VARCHAR(100)
);

-- FLOOR & TABLE
CREATE TABLE floors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  floor_id INT REFERENCES floors(id),
  table_number VARCHAR(50),
  seats INT,
  appointment_resource VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE
);

-- POS TERMINALS & SESSIONS
CREATE TABLE pos_terminals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  terminal_id INT REFERENCES pos_terminals(id),
  user_id INT REFERENCES users(id),
  responsible_label VARCHAR(100),
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  status VARCHAR(50) CHECK (status IN ('OPEN','CLOSED')) DEFAULT 'OPEN',
  opening_balance NUMERIC(10,2),
  closing_balance NUMERIC(10,2)
);

-- ORDERS
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES sessions(id),
  table_id INT REFERENCES tables(id),
  order_number VARCHAR(30) UNIQUE,
  source VARCHAR(50) CHECK (source IN ('POS','SELF')) DEFAULT 'POS',
  status VARCHAR(50) CHECK (status IN ('CREATED','IN_PROGRESS','COMPLETED','PAID')) DEFAULT 'CREATED',
  discount NUMERIC(10,2) DEFAULT 0,
  tip NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  base_price NUMERIC(10,2),
  unit_price NUMERIC(10,2)
);

CREATE TABLE order_item_options (
  id SERIAL PRIMARY KEY,
  order_item_id INT REFERENCES order_items(id) ON DELETE CASCADE,
  attribute_value_id INT REFERENCES attribute_values(id)
);

-- KITCHEN SYSTEM
CREATE TABLE kitchen_tickets (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  status VARCHAR(50) CHECK (status IN ('TO_COOK','PREPARING','COMPLETED')) DEFAULT 'TO_COOK',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kitchen_ticket_items (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES kitchen_tickets(id) ON DELETE CASCADE,
  order_item_id INT REFERENCES order_items(id),
  status VARCHAR(50) CHECK (status IN ('TO_COOK','PREPARING','COMPLETED')) DEFAULT 'TO_COOK'
);

-- PAYMENTS
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  payment_method_id INT REFERENCES payment_methods(id),
  amount NUMERIC(10,2) CHECK (amount > 0),
  status VARCHAR(50) CHECK (status IN ('PENDING','SUCCESS','FAILED')) DEFAULT 'PENDING',
  transaction_ref VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SELF ORDER TOKENS
CREATE TABLE self_order_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(100) UNIQUE CHECK (length(token) >= 16),
  table_id INT REFERENCES tables(id),
  session_id INT REFERENCES sessions(id),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDER LOGS
CREATE TABLE order_logs (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  status VARCHAR(50),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_order_logs_order_time ON order_logs(order_id, changed_at);
CREATE INDEX idx_kitchen_ticket_order ON kitchen_tickets(order_id);
