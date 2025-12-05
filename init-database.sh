#!/bin/bash
# Run this after Render deployment completes

echo "Initializing database schemas..."

# Get database connection info from Render
DATABASE_URL=$(render services get snowguard-postgres --property connectionString)

# Create schemas for each service
psql $DATABASE_URL << EOF
-- Create schemas for each service
CREATE SCHEMA IF NOT EXISTS userschema;
CREATE SCHEMA IF NOT EXISTS hazardschema;
CREATE SCHEMA IF NOT EXISTS aischema;

-- List all schemas
\dn
EOF

echo "✅ Database schemas created!"