-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Extends Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  role text default 'operator' check (role in ('admin', 'operator', 'driver')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- DRIVERS
create table if not exists public.drivers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  vehicle text,
  location text,
  status text default 'available' check (status in ('available', 'busy', 'maintenance')),
  rating numeric default 5.0,
  cnh text,
  cpf text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for drivers
alter table public.drivers enable row level security;

create policy "Drivers are viewable by authenticated users."
  on public.drivers for select
  using ( auth.role() = 'authenticated' );

create policy "Drivers are insertable by authenticated users."
  on public.drivers for insert
  with check ( auth.role() = 'authenticated' );

create policy "Drivers are updatable by authenticated users."
  on public.drivers for update
  using ( auth.role() = 'authenticated' );

create policy "Drivers are deletable by authenticated users."
  on public.drivers for delete
  using ( auth.role() = 'authenticated' );

-- LOADS (Kanban Cards)
create table if not exists public.loads (
  id text primary key, -- Using text ID to match current frontend logic (e.g., "CARGA-001")
  title text not null,
  column_id text not null,
  priority text default 'normal' check (priority in ('high', 'normal')),
  origin text not null,
  destination text not null,
  value text,
  date text,
  driver_id uuid references public.drivers(id),
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id),
  -- Phase 5 Columns
  broadcast_status text DEFAULT 'pending',
  risk_status text DEFAULT 'pending',
  documents_status text DEFAULT 'pending',
  contract_url text,
  checkin_time timestamptz,
  pod_url text,
  invoice_status text DEFAULT 'pending'
);

-- Enable RLS for loads
alter table public.loads enable row level security;

create policy "Loads are viewable by authenticated users."
  on public.loads for select
  using ( auth.role() = 'authenticated' );

create policy "Loads are insertable by authenticated users."
  on public.loads for insert
  with check ( auth.role() = 'authenticated' );

create policy "Loads are updatable by authenticated users."
  on public.loads for update
  using ( auth.role() = 'authenticated' );

create policy "Loads are deletable by authenticated users."
  on public.loads for delete
  using ( auth.role() = 'authenticated' );

-- Add comments for clarity
COMMENT ON COLUMN loads.broadcast_status IS 'Status of load broadcast to drivers (pending, sent)';
COMMENT ON COLUMN loads.risk_status IS 'Risk analysis status (pending, approved, rejected)';
COMMENT ON COLUMN loads.documents_status IS 'Documentation validation status (pending, verified)';
COMMENT ON COLUMN loads.contract_url IS 'URL to the generated PDF contract';
COMMENT ON COLUMN loads.checkin_time IS 'Timestamp when the driver checked in for loading';
COMMENT ON COLUMN loads.pod_url IS 'URL to the Proof of Delivery (POD) document';
COMMENT ON COLUMN loads.invoice_status IS 'Payment/Invoice status (pending, paid)';
