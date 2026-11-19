-- ============================================================================
-- CalorieSnap · Member 5 (Aloysius) · Calorie trends
-- Run AFTER schema.sql and rls.sql. Safe to run more than once.
--
--   calorie_history()  data for the Calorie intake chart on Trend
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. calorie_history(): bars for the Calorie intake chart
-- ----------------------------------------------------------------------------
-- p_range:
--   'week'     → 7 bars, Monday to Sunday of this week
--   'month'    → 5 bars, one per week (this week and the 4 before it)
--   '6months'  → 6 bars, one per month (this month and the 5 before it)
-- Each bar is the average per LOGGED day in that period, split by meal, so a
-- week with 3 logged days is not dragged down by 4 empty ones. For 'week'
-- that is simply the day's total.
-- "Today" is the Malaysian calendar day. Only the caller's own meals count.

-- Speeds up "my meals between two dates" (already in schema.sql; kept here in
-- case the table was created without it).
create index if not exists idx_meals_user_logged_at
  on public.meals (user_id, logged_at desc);

create or replace function public.calorie_history(p_range text default 'week')
returns table (
  bucket_start date,
  label        text,
  breakfast    integer,
  lunch        integer,
  dinner       integer,
  snacks       integer,
  total        integer,
  sum_kcal     integer,
  days_logged  integer,
  is_current   boolean
)
language sql
stable
set search_path = ''
as $$
  with today as (
    select (now() at time zone 'Asia/Kuala_Lumpur')::date as d
  ),
  buckets as (
    -- Week: each day of this week
    select g::date as b_start, g::date as b_end, to_char(g, 'Dy') as b_label
    from today,
         generate_series(date_trunc('week', today.d),
                         date_trunc('week', today.d) + interval '6 days',
                         interval '1 day') g
    where lower(coalesce(p_range, 'week')) = 'week'
    union all
    -- Month: this week and the 4 before it
    select g::date, (g + interval '6 days')::date, to_char(g, 'DD Mon')
    from today,
         generate_series(date_trunc('week', today.d) - interval '4 weeks',
                         date_trunc('week', today.d),
                         interval '1 week') g
    where lower(coalesce(p_range, 'week')) = 'month'
    union all
    -- 6 months: this month and the 5 before it
    select g::date, (g + interval '1 month' - interval '1 day')::date, to_char(g, 'Mon')
    from today,
         generate_series(date_trunc('month', today.d) - interval '5 months',
                         date_trunc('month', today.d),
                         interval '1 month') g
    where lower(coalesce(p_range, 'week')) = '6months'
  ),
  range_limits as (
    select min(b_start) as first_day, max(b_end) as last_day from buckets
  ),
  my_meals as (
    select (m.logged_at at time zone 'Asia/Kuala_Lumpur')::date as d, m.category, m.calories
    from public.meals m, range_limits r
    where m.user_id = auth.uid()
      -- Compare raw timestamps so the index on logged_at can be used.
      and m.logged_at >= (r.first_day::timestamp at time zone 'Asia/Kuala_Lumpur')
      and m.logged_at <  ((r.last_day + 1)::timestamp at time zone 'Asia/Kuala_Lumpur')
  ),
  per_bucket as (
    select
      b.b_start,
      b.b_end,
      b.b_label,
      coalesce(sum(mm.calories) filter (where mm.category = 'Breakfast'), 0) as s_breakfast,
      coalesce(sum(mm.calories) filter (where mm.category = 'Lunch'), 0)     as s_lunch,
      coalesce(sum(mm.calories) filter (where mm.category = 'Dinner'), 0)    as s_dinner,
      coalesce(sum(mm.calories) filter (where mm.category = 'Snacks'), 0)    as s_snacks,
      coalesce(sum(mm.calories), 0)                                          as s_total,
      count(distinct mm.d)                                                   as n_days
    from buckets b
    left join my_meals mm on mm.d between b.b_start and b.b_end
    group by b.b_start, b.b_end, b.b_label
  )
  select
    pb.b_start,
    pb.b_label,
    round(pb.s_breakfast::numeric / greatest(pb.n_days, 1))::int,
    round(pb.s_lunch::numeric     / greatest(pb.n_days, 1))::int,
    round(pb.s_dinner::numeric    / greatest(pb.n_days, 1))::int,
    round(pb.s_snacks::numeric    / greatest(pb.n_days, 1))::int,
    round(pb.s_total::numeric     / greatest(pb.n_days, 1))::int,
    pb.s_total::int,
    pb.n_days::int,
    (select d from today) between pb.b_start and pb.b_end
  from per_bucket pb
  where auth.uid() is not null
  order by pb.b_start;
$$;


-- ----------------------------------------------------------------------------
-- 2. Who may call the functions
-- ----------------------------------------------------------------------------
-- Calorie history is personal, so it needs a sign-in.
-- Also removes the food-search draft (search_food), which the team replaced
-- with the client-side localFoodSearch.
drop function if exists public.search_food(text, text, integer);
drop function if exists public.search_foods(text, text, integer);
drop function if exists public.calorie_trend(date, date);

revoke all on function public.calorie_history(text) from public, anon;
grant execute on function public.calorie_history(text) to authenticated;
