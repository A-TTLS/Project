-- ============================================================================
-- CalorieSnap · Member 5 (Aloysius) · Social: Following & Discover feeds
-- Run AFTER schema.sql, rls.sql, member5_rewards.sql and member5_squad.sql.
-- Safe to run more than once.
--
-- The rule behind this file: a post is seen according to its visibility.
--   public  → every signed-in user
--   circle  → the author's squadmates (Roomie Diet Squad)
--   private → the author only
-- Likes and comments follow the post they belong to.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Helper: do I share a squad with this person?
-- ----------------------------------------------------------------------------
create or replace function public.shares_squad(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid()
      and theirs.user_id = p_other_user_id
  );
$$;

-- Protein of the meal behind a post. Meals themselves may be private, so this
-- returns the number only when the caller is allowed to see the post.
create or replace function public.post_protein(p_post_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select m.protein_g
  from public.social_posts p
  join public.meals m on m.id = p.meal_id
  where p.id = p_post_id
    and (
      p.user_id = auth.uid()
      or p.visibility = 'public'
      or (p.visibility = 'circle' and public.shares_squad(p.user_id))
    );
$$;


-- ----------------------------------------------------------------------------
-- 2. Who can see which post
-- ----------------------------------------------------------------------------
-- Before: only public posts (and your own) were visible, so "circle" posts
-- reached nobody. Also signed-out visitors could read every public post.
drop policy if exists "Public posts are viewable by all authenticated users" on public.social_posts;
drop policy if exists "Posts follow their visibility" on public.social_posts;
create policy "Posts follow their visibility"
  on public.social_posts for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or visibility = 'public'
    or (visibility = 'circle' and public.shares_squad(user_id))
  );

-- Authors may change the visibility or caption of their own posts.
drop policy if exists "Users can update their own posts" on public.social_posts;
create policy "Users can update their own posts"
  on public.social_posts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- ----------------------------------------------------------------------------
-- 3. Likes and comments follow their post
-- ----------------------------------------------------------------------------
-- Before: anyone could read every like and comment, including those on
-- private posts, and could like or comment on posts they cannot see.
-- The sub-select below is itself filtered by the post policy above.

drop policy if exists "Likes are viewable by authenticated users" on public.post_likes;
drop policy if exists "Likes visible with their post" on public.post_likes;
create policy "Likes visible with their post"
  on public.post_likes for select
  to authenticated
  using (exists (select 1 from public.social_posts p where p.id = post_id));

drop policy if exists "Users can toggle their own like" on public.post_likes;
drop policy if exists "Users can like posts they can see" on public.post_likes;
create policy "Users can like posts they can see"
  on public.post_likes for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.social_posts p where p.id = post_id)
  );

drop policy if exists "Comments are viewable by authenticated users" on public.post_comments;
drop policy if exists "Comments visible with their post" on public.post_comments;
create policy "Comments visible with their post"
  on public.post_comments for select
  to authenticated
  using (exists (select 1 from public.social_posts p where p.id = post_id));

drop policy if exists "Users can post comments" on public.post_comments;
drop policy if exists "Users can comment on posts they can see" on public.post_comments;
create policy "Users can comment on posts they can see"
  on public.post_comments for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.social_posts p where p.id = post_id)
  );

-- Comments must have text and stay short.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'post_comments_content_length') then
    alter table public.post_comments
      add constraint post_comments_content_length
      check (length(trim(content)) between 1 and 500);
  end if;
end;
$$;


-- ----------------------------------------------------------------------------
-- 4. social_feed(): posts for the Following or Discover tab
-- ----------------------------------------------------------------------------
-- Runs with the caller's rights, so the policies above decide what comes back.
--   p_tab    'following' → my posts, people I follow, my squadmates
--            'discover'  → public posts from everyone
--   p_search  matches caption, place or author name (Discover)
--   p_filter  'all' | 'under_500' | 'high_protein' | 'campus'
create or replace function public.social_feed(
  p_tab    text default 'discover',
  p_search text default null,
  p_filter text default 'all',
  p_limit  integer default 30
)
returns table (
  post_id         uuid,
  author_id       uuid,
  author_name     text,
  author_username text,
  author_avatar   text,
  author_streak   integer,
  is_me           boolean,
  is_following    boolean,
  is_squadmate    boolean,
  caption         text,
  location_name   text,
  image_url       text,
  calories        integer,
  protein_g       numeric,
  pct_daily_goal  integer,
  visibility      text,
  created_at      timestamptz,
  like_count      integer,
  liked_by_me     boolean,
  comments        jsonb
)
language sql
stable
set search_path = ''
as $$
  with me as (select auth.uid() as id),
  following as (
    select f.following_id as id from public.follows f, me where f.follower_id = me.id
  )
  select
    p.id,
    p.user_id,
    coalesce(a.full_name, a.username, 'Campus foodie'),
    a.username,
    a.avatar_url,
    coalesce(a.streak_days, 0),
    p.user_id = me.id,
    p.user_id in (select id from following),
    public.shares_squad(p.user_id) and p.user_id <> me.id,
    p.caption,
    p.location_name,
    p.image_url,
    p.calories,
    public.post_protein(p.id),
    p.pct_daily_goal,
    p.visibility,
    p.created_at,
    (select count(*)::int from public.post_likes l where l.post_id = p.id),
    exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = me.id),
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'author', coalesce(ca.username, ca.full_name, 'peer'),
               'content', c.content
             ) order by c.created_at)
      from public.post_comments c
      left join public.profiles ca on ca.id = c.user_id
      where c.post_id = p.id
    ), '[]'::jsonb)
  from public.social_posts p
  cross join me
  left join public.profiles a on a.id = p.user_id
  where
    case lower(coalesce(p_tab, 'discover'))
      when 'following' then
        p.user_id = me.id
        or p.user_id in (select id from following)
        or public.shares_squad(p.user_id)
      else
        p.visibility = 'public'
    end
    and (
      coalesce(trim(p_search), '') = ''
      or p.caption       ilike '%' || trim(p_search) || '%'
      or p.location_name ilike '%' || trim(p_search) || '%'
      or a.full_name     ilike '%' || trim(p_search) || '%'
      or a.username      ilike '%' || trim(p_search) || '%'
    )
    and case lower(coalesce(p_filter, 'all'))
      when 'under_500'    then coalesce(p.calories, 0) < 500
      when 'high_protein' then coalesce(public.post_protein(p.id), 0) >= 25
      when 'campus'       then p.location_name ilike any (array['%campus%', '%utm%'])
      else true
    end
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;


-- ----------------------------------------------------------------------------
-- 5. my_people_today(): progress rings at the top of Following
-- ----------------------------------------------------------------------------
-- Shows me and my squadmates only. Squadmates agreed to share their day by
-- joining; people who are merely followed did not, so they are not included.
create or replace function public.my_people_today()
returns table (
  user_id   uuid,
  name      text,
  is_me     boolean,
  pct_today integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with people as (
    select auth.uid() as id
    union
    select theirs.user_id
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid()
  )
  select
    pr.id,
    coalesce(split_part(pr.full_name, ' ', 1), pr.username, 'Member'),
    pr.id = auth.uid(),
    coalesce(round(100.0 * (
      select sum(ml.calories)
      from public.meals ml
      where ml.user_id = pr.id
        and (ml.logged_at at time zone 'Asia/Kuala_Lumpur')::date
            = (now() at time zone 'Asia/Kuala_Lumpur')::date
    ) / nullif(pr.daily_calorie_target, 0)), 0)::int
  from people
  join public.profiles pr on pr.id = people.id
  where auth.uid() is not null
  order by pr.id = auth.uid() desc, 4 desc
  limit 8;
$$;


-- ----------------------------------------------------------------------------
-- 6. Who may call the functions
-- ----------------------------------------------------------------------------
revoke all on function public.shares_squad(uuid)                         from public, anon;
revoke all on function public.post_protein(uuid)                         from public, anon;
revoke all on function public.social_feed(text, text, text, integer)     from public, anon;
revoke all on function public.my_people_today()                          from public, anon;

grant execute on function public.shares_squad(uuid)                      to authenticated;
grant execute on function public.post_protein(uuid)                      to authenticated;
grant execute on function public.social_feed(text, text, text, integer)  to authenticated;
grant execute on function public.my_people_today()                       to authenticated;
