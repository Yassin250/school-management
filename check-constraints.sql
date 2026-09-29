SELECT
  conname AS constraint_name,
  contype AS type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
  AND contype = 'c'
ORDER BY conname;