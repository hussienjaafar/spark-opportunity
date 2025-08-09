-- Patch signals uniqueness with a concrete date column
alter table public.signals
  add column if not exists collected_day date not null default (now()::date);
create unique index if not exists uniq_signals_candidate_signal_day
  on public.signals (candidate_id, signal_id, collected_day);
