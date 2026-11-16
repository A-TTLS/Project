-- ============================================================================
-- CalorieSnap · Member 5 (Aloysius) · Roomie Diet Squad: groups, meal board, streaks
-- Run AFTER database/schema.sql. Safe to run more than once.
--
-- The rule behind this file: squad data is only visible to members of that
-- squad. Creating, joining and nudging go through the functions below, which
-- check the rules on the server.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Helper: is the signed-in user a member of this squad?
-- ----------------------------------------------------------------------------
-- Used inside the policies below. It runs as the table owner so the policy on
-- group_members does not end up checking itself in a loop.
create or replace function public.is_squad_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;


-- ----------------------------------------------------------------------------
-- 2. Close the open policies from schema.sql
-- ----------------------------------------------------------------------------
-- Before: every signed-in user could see every squad and its invite code,
-- see every member list, join any squad, and nudge anyone.

drop policy if exists "Group circles viewable by members" on public.group_circles;
drop policy if exists "Authenticated users can create a group circle" on public.group_circles;
drop policy if exists "Squads visible to their members" on public.group_circles;
create policy "Squads visible to their members"
  on public.group_circles for select
  to authenticated
  using (public.is_squad_member(id));

drop policy if exists "Group members viewable by authenticated users" on public.group_members;
drop policy if exists "Users can join a group circle" on public.group_members;
drop policy if exists "Members see their squadmates" on public.group_members;
create policy "Members see their squadmates"
  on public.group_members for select
  to authenticated
  using (public.is_squad_member(group_id));

drop policy if exists "Users can leave a squad" on public.group_members;
create policy "Users can leave a squad"
  on public.group_members for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can send nudges" on public.group_nudges;


-- ----------------------------------------------------------------------------
-- 3. Streaks: consecutive days with at least one logged meal
-- ----------------------------------------------------------------------------
-- A streak is still alive if the last meal was today or yesterday
-- (Malaysian calendar day), so it only breaks after a whole day with no meal.
create or replace function public.meal_streak(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with days as (
    select distinct (logged_at at time zone 'Asia/Kuala_Lumpur')::date as d
    from public.meals
    where user_id = p_user_id
  ),
  -- Consecutive days share the same "run" value (date + position).
  ranked as (
    select d, d + (row_number() over (order by d desc))::int as run
    from days
  ),
  latest as (
    select d, run from ranked order by d desc limit 1
  )
  select coalesce((
    select count(*)::int
    from ranked r, latest l
    where r.run = l.run
      and l.d >= (now() at time zone 'Asia/Kuala_Lumpur')::date - 1
  ), 0);
$$;

-- Keep profiles.streak_days (shown on Rewards and Profile) in step with meals.
create or replace function public.sync_meal_streak()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
begin
  update public.profiles
  set streak_days = public.meal_streak(v_user)
  where id = v_user;
  return null;
end;
$$;

drop trigger if exists on_meal_change_sync_streak on public.meals;
create trigger on_meal_change_sync_streak
  after insert or delete or update of logged_at on public.meals
  for each row execute function public.sync_meal_streak();

-- New accounts start at 0 days: there are no meals yet.
-- (handle_new_user in schema.sql sets 1; this corrects it on insert.)
create or replace function public.start_streak_at_zero()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.streak_days := 0;
  return new;
end;
$$;

drop trigger if exists on_profile_start_streak on public.profiles;
create trigger on_profile_start_streak
  before insert on public.profiles
  for each row execute function public.start_streak_at_zero();

-- One-off: recalculate everyone's streak from their meals.
update public.profiles p
set streak_days = public.meal_streak(p.id);


-- ----------------------------------------------------------------------------
-- 4. create_squad(): start a squad and become its admin
-- ----------------------------------------------------------------------------
create or replace function public.create_squad(p_name text, p_description text default null)
returns public.group_circles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_name  text := trim(p_name);
  v_squad public.group_circles%rowtype;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;
  if v_name is null or length(v_name) not between 1 and 40 then
    raise exception 'Squad name must be 1 to 40 characters';
  end if;

  -- Retry in the rare case the random code already exists.
  loop
    begin
      insert into public.group_circles (name, description, invite_code, created_by)
      values (
        v_name,
        nullif(trim(p_description), ''),
        'SQUAD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
        v_user
      )
      returning * into v_squad;
      exit;
    exception when unique_violation then
      -- try another code
    end;
  end loop;

  insert into public.group_members (group_id, user_id, role)
  values (v_squad.id, v_user, 'admin');

  return v_squad;
end;
$$;


-- ----------------------------------------------------------------------------
-- 5. join_squad(): join with an invite code
-- ----------------------------------------------------------------------------
create or replace function public.join_squad(p_invite_code text)
returns public.group_circles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := auth.uid();
  v_squad   public.group_circles%rowtype;
  v_members integer;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  select * into v_squad
  from public.group_circles
  where invite_code = upper(trim(p_invite_code))
  for update;

  if not found then
    raise exception 'Invite code not found';
  end if;

  if exists (select 1 from public.group_members
             where group_id = v_squad.id and user_id = v_user) then
    raise exception 'You are already in this squad';
  end if;

  select count(*) into v_members
  from public.group_members
  where group_id = v_squad.id;

  if v_members >= 8 then
    raise exception 'This squad is full (8 members)';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_squad.id, v_user, 'member');

  return v_squad;
end;
$$;


-- ----------------------------------------------------------------------------
-- 6. my_squads(): the squads I am in, with member count and total streak
-- ----------------------------------------------------------------------------
create or replace function public.my_squads()
returns table (
  id           uuid,
  name         text,
  description  text,
  invite_code  text,
  my_role      text,
  member_count integer,
  total_streak integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name, g.description, g.invite_code, me.role,
         (select count(*)::int from public.group_members m where m.group_id = g.id),
         (select coalesce(sum(public.meal_streak(m.user_id)), 0)::int
            from public.group_members m where m.group_id = g.id)
  from public.group_members me
  join public.group_circles g on g.id = me.group_id
  where me.user_id = auth.uid()
  order by me.joined_at;
$$;


-- ----------------------------------------------------------------------------
-- 7. squad_board(): today's meal board for one squad
-- ----------------------------------------------------------------------------
-- Members only see whether each slot is logged and the day's calorie total,
-- not each other's individual meals.
create or replace function public.squad_board(p_group_id uuid)
returns table (
  user_id        uuid,
  full_name      text,
  username       text,
  avatar_url     text,
  is_me          boolean,
  streak_days    integer,
  calories_today integer,
  calorie_target integer,
  has_breakfast  boolean,
  has_lunch      boolean,
  has_dinner     boolean,
  nudged_slots   text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if not public.is_squad_member(p_group_id) then
    raise exception 'You are not a member of this squad';
  end if;

  return query
  with today_meals as (
    select ml.user_id, ml.category, ml.calories
    from public.meals ml
    join public.group_members gm on gm.user_id = ml.user_id and gm.group_id = p_group_id
    where (ml.logged_at at time zone 'Asia/Kuala_Lumpur')::date = v_today
  )
  select
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.id = auth.uid(),
    public.meal_streak(p.id),
    coalesce((select sum(t.calories) from today_meals t where t.user_id = p.id), 0)::int,
    coalesce(p.daily_calorie_target, 1850),
    exists (select 1 from today_meals t where t.user_id = p.id and t.category = 'Breakfast'),
    exists (select 1 from today_meals t where t.user_id = p.id and t.category = 'Lunch'),
    exists (select 1 from today_meals t where t.user_id = p.id and t.category = 'Dinner'),
    coalesce(array(
      select distinct n.meal_slot
      from public.group_nudges n
      where n.group_id = p_group_id
        and n.sender_id = auth.uid()
        and n.target_user_id = p.id
        and (n.created_at at time zone 'Asia/Kuala_Lumpur')::date = v_today
    ), '{}')
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id
  order by 6 desc, p.full_name;
end;
$$;


-- ----------------------------------------------------------------------------
-- 8. send_nudge(): remind a squadmate to log a meal
-- ----------------------------------------------------------------------------
-- Rules: both people are in the squad, you cannot nudge yourself, the slot is
-- not logged yet, and one nudge per person per slot per day.
create or replace function public.send_nudge(p_group_id uuid, p_target_user_id uuid, p_meal_slot text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;
  if p_meal_slot not in ('Breakfast', 'Lunch', 'Dinner') then
    raise exception 'Unknown meal slot';
  end if;
  if p_target_user_id = v_user then
    raise exception 'You cannot nudge yourself';
  end if;
  if not public.is_squad_member(p_group_id) then
    raise exception 'You are not a member of this squad';
  end if;
  if not exists (select 1 from public.group_members
                 where group_id = p_group_id and user_id = p_target_user_id) then
    raise exception 'That person is not in this squad';
  end if;

  if exists (select 1 from public.meals
             where user_id = p_target_user_id
               and category = p_meal_slot
               and (logged_at at time zone 'Asia/Kuala_Lumpur')::date = v_today) then
    raise exception 'They already logged %', lower(p_meal_slot);
  end if;

  if exists (select 1 from public.group_nudges
             where group_id = p_group_id
               and sender_id = v_user
               and target_user_id = p_target_user_id
               and meal_slot = p_meal_slot
               and (created_at at time zone 'Asia/Kuala_Lumpur')::date = v_today) then
    raise exception 'Already nudged for % today', lower(p_meal_slot);
  end if;

  insert into public.group_nudges (group_id, sender_id, target_user_id, meal_slot)
  values (p_group_id, v_user, p_target_user_id, p_meal_slot);
end;
$$;


-- ----------------------------------------------------------------------------
-- 9. Who may call the functions
-- ----------------------------------------------------------------------------
-- Supabase grants new functions to everyone by default, so that is taken away
-- first. meal_streak and sync_meal_streak are internal only.
revoke all on function public.is_squad_member(uuid)               from public, anon;
revoke all on function public.meal_streak(uuid)                   from public, anon, authenticated;
revoke all on function public.sync_meal_streak()                  from public, anon, authenticated;
revoke all on function public.start_streak_at_zero()              from public, anon, authenticated;
revoke all on function public.create_squad(text, text)            from public, anon;
revoke all on function public.join_squad(text)                    from public, anon;
revoke all on function public.my_squads()                         from public, anon;
revoke all on function public.squad_board(uuid)                   from public, anon;
revoke all on function public.send_nudge(uuid, uuid, text)        from public, anon;

grant execute on function public.is_squad_member(uuid)            to authenticated;
grant execute on function public.create_squad(text, text)         to authenticated;
grant execute on function public.join_squad(text)                 to authenticated;
grant execute on function public.my_squads()                      to authenticated;
grant execute on function public.squad_board(uuid)                to authenticated;
grant execute on function public.send_nudge(uuid, uuid, text)     to authenticated;
