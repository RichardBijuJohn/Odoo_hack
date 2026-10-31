-- Add product categories and inventory tracking without replacing existing products.
CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE products
  ADD COLUMN category_id INT NULL AFTER category,
  ADD COLUMN cost_price DECIMAL(10, 2) NULL AFTER price,
  ADD COLUMN stock_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0.000 AFTER cost_price,
  ADD COLUMN minimum_stock_level DECIMAL(12, 3) NOT NULL DEFAULT 0.000 AFTER stock_quantity,
  ADD COLUMN unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'unit' AFTER minimum_stock_level,
  ADD COLUMN image_url VARCHAR(2048) NULL AFTER unit_of_measure,
  MODIFY COLUMN status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active';

INSERT INTO product_categories (name)
SELECT DISTINCT TRIM(category)
FROM products
WHERE category IS NOT NULL AND TRIM(category) <> ''
ON DUPLICATE KEY UPDATE name = VALUES(name);

UPDATE products p
JOIN product_categories c ON c.name = TRIM(p.category)
SET p.category_id = c.id;

ALTER TABLE products
  ADD CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL;

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