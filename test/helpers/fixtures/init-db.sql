\c postgres;

-- kick any connections to this database
SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'conjure_db_test' AND pid <> pg_backend_pid();

DO
$ohyes$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles
    WHERE rolname = 'conjure_db_user'
  ) THEN
    CREATE ROLE conjure_db_user LOGIN PASSWORD '$@ $3cr3t';
  END IF;
END
$ohyes$;

DROP DATABASE IF EXISTS conjure_db_test;
CREATE DATABASE conjure_db_test WITH OWNER conjure_db_user;
