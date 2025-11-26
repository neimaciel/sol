-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Extends Auth)
create table public.profiles (
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
create table public.drivers (
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
create table public.loads (
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
  user_id uuid references auth.users(id) -- Optional: to track who created
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

-- OPERATORS (Managed manually or via Auth)
-- For now, we can query profiles where role = 'operator'
