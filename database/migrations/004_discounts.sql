-- Apply once after the billing and product migrations.
CREATE TABLE IF NOT EXISTS discounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(500) NULL,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(12, 2) NOT NULL,
  minimum_purchase_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  minimum_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  apply_to ENUM('product', 'subscription') NOT NULL DEFAULT 'subscription',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_discounts_dates (start_date, end_date),
  INDEX idx_discounts_status (status)
);

CREATE TABLE IF NOT EXISTS discount_products (
  discount_id INT NOT NULL,
  product_id INT NOT NULL,
  PRIMARY KEY (discount_id, product_id),
  FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS discount_plans (
  discount_id INT NOT NULL,
  plan_id INT NOT NULL,
  PRIMARY KEY (discount_id, plan_id),
  FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

ALTER TABLE invoice_items
  ADD COLUMN product_id INT NULL AFTER invoice_id,
  ADD CONSTRAINT fk_invoice_items_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE invoices
  ADD COLUMN discount_id INT NULL AFTER tax_amount,
  ADD COLUMN discount_name VARCHAR(150) NULL AFTER discount_id,
  ADD COLUMN discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER discount_name,
  ADD CONSTRAINT fk_invoices_discount
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL;
