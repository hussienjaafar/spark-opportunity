-- Enable RLS on all public tables created
alter table public.candidates enable row level security;
alter table public.signals enable row level security;
alter table public.reports enable row level security;
alter table public.watches enable row level security;
alter table public.provider_usage enable row level security;