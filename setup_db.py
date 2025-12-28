#!/usr/bin/env python3
import psycopg2
import os

# Database connection parameters
DATABASE_URL = "postgresql://postgres:mKV57eO3aS96Bx4y@db.ekimcihxrnigghnappjv.supabase.co:5432/postgres"

try:
    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("Connected to Supabase PostgreSQL!")
    
    # Read and execute schema
    with open('supabase/migrations/20241227000001_initial_schema.sql', 'r') as f:
        schema_sql = f.read()
    
    print("Executing schema...")
    cursor.execute(schema_sql)
    conn.commit()
    print("✅ Schema created successfully!")
    
    # Read and execute seed data
    with open('supabase/migrations/20241227000002_seed_data.sql', 'r') as f:
        seed_sql = f.read()
    
    print("Executing seed data...")
    cursor.execute(seed_sql)
    conn.commit()
    print("✅ Seed data inserted successfully!")
    
    # Verify data
    cursor.execute("SELECT COUNT(*) FROM loads WHERE id = 'load-example-1'")
    count = cursor.fetchone()[0]
    print(f"✅ Verified: load-example-1 exists: {count > 0}")
    
    cursor.close()
    conn.close()
    print("🎉 Database setup complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")