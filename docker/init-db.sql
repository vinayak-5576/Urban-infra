-- Initialize PostGIS extension on default database
CREATE EXTENSION IF NOT EXISTS postgis;

-- Initialize separate dedicated test database with PostGIS
SELECT 'CREATE DATABASE urban_infra_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'urban_infra_test')\gexec

\c urban_infra_test
CREATE EXTENSION IF NOT EXISTS postgis;
