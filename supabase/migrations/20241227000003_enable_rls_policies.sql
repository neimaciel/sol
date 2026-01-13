-- Enable Row Level Security (RLS) on all tables
-- This migration adds RLS policies to allow authenticated users to access the database

-- ============================================
-- GROUPS TABLE
-- ============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select groups
CREATE POLICY "Allow authenticated users to select groups"
ON groups FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert groups
CREATE POLICY "Allow authenticated users to insert groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update groups
CREATE POLICY "Allow authenticated users to update groups"
ON groups FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete groups
CREATE POLICY "Allow authenticated users to delete groups"
ON groups FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- DRIVERS TABLE
-- ============================================

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select drivers
CREATE POLICY "Allow authenticated users to select drivers"
ON drivers FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert drivers
CREATE POLICY "Allow authenticated users to insert drivers"
ON drivers FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update drivers
CREATE POLICY "Allow authenticated users to update drivers"
ON drivers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete drivers
CREATE POLICY "Allow authenticated users to delete drivers"
ON drivers FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- LOADS TABLE
-- ============================================

ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select loads
CREATE POLICY "Allow authenticated users to select loads"
ON loads FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert loads
CREATE POLICY "Allow authenticated users to insert loads"
ON loads FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update loads
CREATE POLICY "Allow authenticated users to update loads"
ON loads FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete loads
CREATE POLICY "Allow authenticated users to delete loads"
ON loads FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- PAYMENTS TABLE
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select payments
CREATE POLICY "Allow authenticated users to select payments"
ON payments FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert payments
CREATE POLICY "Allow authenticated users to insert payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update payments
CREATE POLICY "Allow authenticated users to update payments"
ON payments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete payments
CREATE POLICY "Allow authenticated users to delete payments"
ON payments FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- OPERATORS TABLE
-- ============================================

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select operators
CREATE POLICY "Allow authenticated users to select operators"
ON operators FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert operators
CREATE POLICY "Allow authenticated users to insert operators"
ON operators FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update operators
CREATE POLICY "Allow authenticated users to update operators"
ON operators FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete operators
CREATE POLICY "Allow authenticated users to delete operators"
ON operators FOR DELETE
TO authenticated
USING (true);
