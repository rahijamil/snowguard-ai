-- ===============================================
-- SnowGuard AI - Database Initialization
-- Creates separate databases for each microservice
-- ===============================================

-- Create databases if they don't exist
SELECT 'CREATE DATABASE userdb' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'userdb')\gexec
SELECT 'CREATE DATABASE hazarddb' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hazarddb')\gexec
SELECT 'CREATE DATABASE aidb' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aidb')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE userdb TO postgres;
GRANT ALL PRIVILEGES ON DATABASE hazarddb TO postgres;
GRANT ALL PRIVILEGES ON DATABASE aidb TO postgres;