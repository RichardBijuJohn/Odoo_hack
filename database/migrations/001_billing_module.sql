-- Apply once to an existing Brightloop database.
-- Fresh database installs should use the current database.sql schema instead.

ALTER TABLE invoices
  ADD COLUMN paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER total_amount,
  MODIFY COLUMN status ENUM('draft', 'pending', 'overdue', 'paid', 'canceled', 'confirmed', 'cancelled') NULL DEFAULT 'draft';

UPDATE invoices SET status = 'confirmed' WHERE status IS NULL;

UPDATE invoices
SET status = CASE
  WHEN status IN ('pending', 'overdue') THEN 'confirmed'
  WHEN status = 'canceled' THEN 'cancelled'
  ELSE status
END;

UPDATE invoices i
LEFT JOIN (
  SELECT invoice_id, SUM(amount) AS paid_amount
  FROM payments
  WHERE status = 'completed'
  GROUP BY invoice_id
) p ON p.invoice_id = i.id
SET i.paid_amount = COALESCE(p.paid_amount, 0);

UPDATE invoices
SET status = 'paid'
WHERE status <> 'cancelled' AND paid_amount >= total_amount AND total_amount > 0;

UPDATE invoices
SET status = 'confirmed'
WHERE status = 'paid' AND paid_amount < total_amount;

ALTER TABLE invoices
  MODIFY COLUMN status ENUM('draft', 'confirmed', 'paid', 'cancelled') NOT NULL DEFAULT 'draft';

CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_items_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

UPDATE payments SET payment_method = 'manual' WHERE payment_method IS NULL;

ALTER TABLE payments
  MODIFY COLUMN payment_method ENUM('cash', 'card', 'bank_transfer', 'upi', 'credit_card', 'paypal', 'stripe', 'manual') NOT NULL DEFAULT 'card',
  ADD COLUMN note VARCHAR(1000) NULL AFTER transaction_ref;
