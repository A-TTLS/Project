-- ============================================================================
-- CalorieSnap · Member 5 (Aloysius) · Rewards: SnapPoints, daily missions, vouchers
-- Run AFTER database/schema.sql and database/rls.sql. Safe to run more than once.
--
-- The rule behind this file: the app may READ points, missions and vouchers,
-- but it can never WRITE them directly. Every change to points goes through
-- one of the functions below, which check the rules on the server.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Lock the points columns on profiles
-- ----------------------------------------------------------------------------
-- The existing policy lets users update their own profile row, which would
-- also let them set snap_points or streak_days to any number. Users keep the
-- right to edit their personal details, but only these columns.
revoke update on public.profiles from anon, authenticated;
grant update (
  full_name, username, avatar_url, bio, gender, age,
  height_cm, current_weight_kg, target_weight_kg, activity_level,
  daily_calorie_target, target_protein_g, target_carbs_g, target_fat_g,
  updated_at
) on public.profiles to authenticated;

-- Remove the policies that let the app claim vouchers or complete missions itself.
drop policy if exists "Users can claim vouchers" on public.claimed_vouchers;
drop policy if exists "Users can update own daily missions" on public.daily_missions;
drop policy if exists "Users can insert own daily missions" on public.daily_missions;


-- ----------------------------------------------------------------------------
-- 2. Points history: every point earned or spent, one row each
-- ----------------------------------------------------------------------------
-- profiles.snap_points stays as the fast number the screens show; this table
-- is the record of how that number came about.
create table if not exists public.points_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  delta      integer not null check (delta <> 0),
  reason     text not null check (reason in ('signup_bonus', 'mission', 'voucher')),
  ref_id     uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_points_ledger_user
  on public.points_ledger (user_id, created_at desc);

alter table public.points_ledger enable row level security;
drop policy if exists "Users can view own points history" on public.points_ledger;
create policy "Users can view own points history"
  on public.points_ledger for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- New accounts start with bonus points (set by handle_new_user); record them.
create or replace function public.log_signup_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.snap_points > 0 then
    insert into public.points_ledger (user_id, delta, reason)
    values (new.id, new.snap_points, 'signup_bonus');
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_created_log_points on public.profiles;
create trigger on_profile_created_log_points
  after insert on public.profiles
  for each row execute function public.log_signup_points();

-- One-off: give accounts created before this file an opening entry.
insert into public.points_ledger (user_id, delta, reason)
select p.id, p.snap_points, 'signup_bonus'
from public.profiles p
where p.snap_points > 0
  and not exists (select 1 from public.points_ledger l where l.user_id = p.id);


-- ----------------------------------------------------------------------------
-- 3. Voucher stock and validity
-- ----------------------------------------------------------------------------
-- stock: how many can still be claimed (empty = unlimited).
-- valid_days: how long a claimed voucher stays usable.
alter table public.vouchers
  add column if not exists stock integer check (stock is null or stock >= 0),
  add column if not exists valid_days integer not null default 30 check (valid_days > 0);


-- ----------------------------------------------------------------------------
-- 4. refresh_my_missions(): today's missions with progress worked out on the server
-- ----------------------------------------------------------------------------
-- Creates today's three missions if they do not exist yet, recalculates their
-- progress from meals and daily_metrics, and returns them. "Today" is the
-- Malaysian calendar day.
create or replace function public.refresh_my_missions()
returns setof public.daily_missions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_meals integer;
  v_steps integer;
  v_water integer;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  insert into public.daily_missions
    (user_id, mission_date, mission_type, target_progress, points_reward)
  values
    (v_user, v_today, 'snap_3_meals', 3,    50),
    (v_user, v_today, 'steps_8000',   8000, 30),
    (v_user, v_today, 'water_2000',   2000, 20)
  on conflict (user_id, mission_date, mission_type) do nothing;

  select count(*) into v_meals
  from public.meals
  where user_id = v_user
    and (logged_at at time zone 'Asia/Kuala_Lumpur')::date = v_today;

  select coalesce(max(steps_count), 0), coalesce(max(water_ml), 0)
  into v_steps, v_water
  from public.daily_metrics
  where user_id = v_user
    and metric_date = v_today;

  -- Claimed missions are final, so only unclaimed ones are recalculated.
  update public.daily_missions m
  set current_progress = least(p.amount, m.target_progress),
      is_completed     = p.amount >= m.target_progress
  from (values
          ('snap_3_meals', v_meals),
          ('steps_8000',   v_steps),
          ('water_2000',   v_water)
       ) as p(mission_type, amount)
  where m.user_id = v_user
    and m.mission_date = v_today
    and m.mission_type = p.mission_type
    and m.is_claimed = false;

  return query
    select * from public.daily_missions
    where user_id = v_user
      and mission_date = v_today
    order by points_reward desc;
end;
$$;


-- ----------------------------------------------------------------------------
-- 5. claim_mission(): collect the points for a completed mission
-- ----------------------------------------------------------------------------
-- Returns the new SnapPoints balance.
create or replace function public.claim_mission(p_mission_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := auth.uid();
  v_mission public.daily_missions%rowtype;
  v_reward  integer;
  v_balance integer;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  -- Lock the mission so a double tap cannot claim it twice.
  select * into v_mission
  from public.daily_missions
  where id = p_mission_id and user_id = v_user
  for update;

  if not found then
    raise exception 'Mission not found';
  end if;
  if not v_mission.is_completed then
    raise exception 'Mission is not completed yet';
  end if;
  if v_mission.is_claimed then
    raise exception 'Mission reward already claimed';
  end if;

  -- The reward comes from the mission type, never from the stored row,
  -- so a tampered row cannot pay out more.
  v_reward := case v_mission.mission_type
                when 'snap_3_meals' then 50
                when 'steps_8000'   then 30
                when 'water_2000'   then 20
              end;
  if v_reward is null then
    raise exception 'Unknown mission type';
  end if;

  update public.daily_missions set is_claimed = true where id = v_mission.id;

  insert into public.points_ledger (user_id, delta, reason, ref_id)
  values (v_user, v_reward, 'mission', v_mission.id);

  update public.profiles
  set snap_points = snap_points + v_reward
  where id = v_user
  returning snap_points into v_balance;

  return v_balance;
end;
$$;


-- ----------------------------------------------------------------------------
-- 6. redeem_voucher(): spend SnapPoints on a voucher
-- ----------------------------------------------------------------------------
-- Checks the balance and stock, takes the points, issues a voucher with a
-- random code, and records it all. Either everything happens or nothing does.
create or replace function public.redeem_voucher(p_voucher_id uuid)
returns public.claimed_vouchers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := auth.uid();
  v_points  integer;
  v_voucher public.vouchers%rowtype;
  v_claim   public.claimed_vouchers%rowtype;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  -- Lock the balance first so two quick taps cannot spend the same points twice.
  select snap_points into v_points
  from public.profiles
  where id = v_user
  for update;

  if v_points is null then
    raise exception 'Profile not found';
  end if;

  select * into v_voucher
  from public.vouchers
  where id = p_voucher_id and is_active
  for update;

  if not found then
    raise exception 'Voucher not available';
  end if;
  if v_voucher.stock is not null and v_voucher.stock <= 0 then
    raise exception 'Voucher is out of stock';
  end if;
  if v_points < v_voucher.points_cost then
    raise exception 'Need % more SnapPoints', v_voucher.points_cost - v_points;
  end if;

  update public.profiles
  set snap_points = snap_points - v_voucher.points_cost
  where id = v_user;

  if v_voucher.stock is not null then
    update public.vouchers set stock = stock - 1 where id = v_voucher.id;
  end if;

  insert into public.claimed_vouchers (user_id, voucher_id, voucher_code, expires_at)
  values (
    v_user,
    v_voucher.id,
    'SNAP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    now() + make_interval(days => v_voucher.valid_days)
  )
  returning * into v_claim;

  insert into public.points_ledger (user_id, delta, reason, ref_id)
  values (v_user, -v_voucher.points_cost, 'voucher', v_claim.id);

  return v_claim;
end;
$$;


-- ----------------------------------------------------------------------------
-- 7. Who may call the functions
-- ----------------------------------------------------------------------------
-- Only signed-in users. Supabase grants new functions to everyone by default,
-- so that is taken away first.
revoke all on function public.log_signup_points()     from public, anon, authenticated;
revoke all on function public.refresh_my_missions()   from public, anon;
revoke all on function public.claim_mission(uuid)     from public, anon;
revoke all on function public.redeem_voucher(uuid)    from public, anon;
grant execute on function public.refresh_my_missions() to authenticated;
grant execute on function public.claim_mission(uuid)   to authenticated;
grant execute on function public.redeem_voucher(uuid)  to authenticated;
