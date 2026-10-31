-- ==========================================================
-- Brightloop Subscription Management System - Database Schema
-- Updated with Passwords, Variants, Plans Lifecycle & Roles
-- ==========================================================

CREATE DATABASE IF NOT EXISTS brightloop_db;
USE brightloop_db;

-- 1. Users / Staff Table with password & role constraints
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
  department VARCHAR(100) NULL,
  company_name VARCHAR(150) NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expiry DATETIME NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

<<<<<<< HEAD
-- 2. Products Table (sales price, cost price, internal notes)
=======
-- 2. Products Table
CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

>>>>>>> 16143d5c5cc45687c84965c85ea3e2995625fc37
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
<<<<<<< HEAD
  type ENUM('Software', 'Hardware', 'Service', 'Consulting') DEFAULT 'Software',
  sales_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  status ENUM('Active', 'Archived') DEFAULT 'Active',
=======
  description TEXT,
  category VARCHAR(50) DEFAULT 'Software',
  category_id INT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cost_price DECIMAL(10, 2) NULL,
  stock_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  minimum_stock_level DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'unit',
  image_url VARCHAR(2048) NULL,
  status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
>>>>>>> 16143d5c5cc45687c84965c85ea3e2995625fc37
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_stock_movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  previous_quantity DECIMAL(12, 3) NOT NULL,
  quantity_change DECIMAL(12, 3) NOT NULL,
  new_quantity DECIMAL(12, 3) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_stock_movements_product_created (product_id, created_at)
);

-- 3. Product Variants (e.g. Brand attribute: Odoo adds 560 to price)
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  attribute_name VARCHAR(100) NOT NULL,
  attribute_value VARCHAR(150) NOT NULL,
  price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 4. Subscription Plans Table (Daily, Weekly, Monthly, Yearly + Min Quantity & Lifecycle flags)
CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  billing_cycle ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
  price DECIMAL(10, 2) NOT NULL,
  min_quantity INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  auto_close_on_end BOOLEAN DEFAULT TRUE,
  can_close_early BOOLEAN DEFAULT TRUE,
  can_pause BOOLEAN DEFAULT TRUE,
  can_renew BOOLEAN DEFAULT TRUE,
  status ENUM('Active', 'Archived') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 5. Subscriptions Table (Customer-scoped lifecycle)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  status ENUM('active', 'paused', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
);

-- 6. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT NULL,
  user_id INT NOT NULL,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('draft', 'pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);
