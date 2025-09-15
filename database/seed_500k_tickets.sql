-- Seed 500,000 tickets in batches to avoid long transactions and timeouts
-- Run this in Supabase SQL editor or via psql

DO $$
DECLARE
  batch_size integer := 10000; -- 10k per batch
  start_i integer := 1;
  end_i integer := 500000;
  i integer;
BEGIN
  i := start_i;
  WHILE i <= end_i LOOP
    INSERT INTO tickets (
      ticket_number,
      device_type,
      owner_name,
      facility,
      status,
      description
    )
    SELECT
      'TK' || to_char(n, 'FM000000'),
      CASE (n % 4)
        WHEN 0 THEN 'Laptop'
        WHEN 1 THEN 'Desktop'
        WHEN 2 THEN 'Printer'
        ELSE 'Network Device'
      END,
      'Seed User ' || n,
      CASE (n % 5)
        WHEN 0 THEN 'Main Office'
        WHEN 1 THEN 'IT Department'
        WHEN 2 THEN 'Reception'
        WHEN 3 THEN 'Finance'
        ELSE 'HR'
      END,
      'pending',
      'Seeded ticket #' || n
    FROM generate_series(i, LEAST(i + batch_size - 1, end_i)) AS g(n)
    ON CONFLICT (ticket_number) DO NOTHING;

    -- Optional: small pause to reduce load; comment out if not needed
    -- PERFORM pg_sleep(0.05);

    i := i + batch_size;
  END LOOP;
END $$;

ANALYZE tickets; 