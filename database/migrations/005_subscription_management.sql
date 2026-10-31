-- Apply once to an existing Brightloop database.
-- Subscription ownership uses users.id for customer accounts.

ALTER TABLE plans
  ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'USD' AFTER price,
  ADD COLUMN trial_days INT NOT NULL DEFAULT 0 AFTER currency,
  ADD COLUMN user_limit INT NOT NULL DEFAULT 1 AFTER trial_days;

ALTER TABLE subscriptions
  MODIFY COLUMN status ENUM('pending', 'active', 'expired', 'cancelled', 'paused', 'closed') NOT NULL DEFAULT 'pending',
  ADD COLUMN billing_cycle ENUM('daily', 'weekly', 'monthly', 'yearly') NULL AFTER plan_id,
  ADD COLUMN duration INT NOT NULL DEFAULT 1 AFTER billing_cycle,
  ADD COLUMN original_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER end_date,
  ADD COLUMN discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER original_amount,
  ADD COLUMN final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER discount_amount,
  ADD COLUMN payment_status ENUM('unpaid', 'pending', 'paid', 'failed') NOT NULL DEFAULT 'pending' AFTER final_amount,
  ADD COLUMN next_billing_date DATE NULL AFTER payment_status,
  ADD COLUMN cancellation_reason VARCHAR(500) NULL AFTER next_billing_date,
  ADD COLUMN notes TEXT NULL AFTER cancellation_reason;

UPDATE subscriptions s
JOIN plans p ON p.id = s.plan_id
SET s.billing_cycle = p.billing_cycle,
    s.original_amount = p.price * s.quantity,
    s.final_amount = p.price * s.quantity,
    s.payment_status = CASE WHEN s.status = 'active' THEN 'paid' ELSE 'pending' END
WHERE s.billing_cycle IS NULL;

ALTER TABLE subscriptions
  MODIFY COLUMN billing_cycle ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly';
