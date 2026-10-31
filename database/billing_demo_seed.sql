-- Optional demo customers for a fresh hackathon database without customer records.
-- This only adds customers to the existing customers table; it creates no duplicate entities.
INSERT INTO customers (name, email, phone, company_name, status)
VALUES
  ('Demo Customer One', 'demo.customer1@brightloop.example', '+91-90000-00001', 'Brightloop Demo', 'active'),
  ('Demo Customer Two', 'demo.customer2@brightloop.example', '+91-90000-00002', 'Brightloop Demo', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  status = 'active';
