create table businesses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text,
  email text,
  phone text,
  website text,
  social_handles jsonb default '{}',
  category text,
  met_at text,
  notes text,
  card_image_url text,
  needs_review boolean default false
);

create table scan_confidence (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references businesses(id) on delete cascade not null,
  field_name text not null,
  confidence_score float not null
);

create table feedback (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  note text not null,
  business_id uuid references businesses(id) on delete set null
);

-- Auto-update updated_at on businesses
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger businesses_updated_at
  before update on businesses
  for each row execute function update_updated_at();

-- Row Level Security: only authenticated users can access data
alter table businesses enable row level security;
alter table scan_confidence enable row level security;
alter table feedback enable row level security;

create policy "authenticated access" on businesses
  for all using (auth.role() = 'authenticated');

create policy "authenticated access" on scan_confidence
  for all using (auth.role() = 'authenticated');

create policy "authenticated access" on feedback
  for all using (auth.role() = 'authenticated');
