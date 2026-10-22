-- ============================================================
-- 800Path — Admin views for telling users apart
-- Run this in the Supabase SQL editor (safe to re-run). Then:
--   select * from admin.users;        -- everyone who actually did something
--   select * from admin.all_users;    -- including guests who clicked Begin and left
--   select * from admin.summary;      -- headline counts
--   select * from admin.likely_same_device; -- ids that are probably one computer
--
-- Guests are labelled "Guest-XXXXXX": the first 6 characters of their user id, so a
-- label maps straight onto the actor_id you see in Authentication → Logs.
--
-- These live in their own `admin` schema, which the API does not expose, and the grants
-- below shut out the anon/authenticated roles too. Never move them into `public`: that
-- would publish every user's email through the anon key.
-- ============================================================

create schema if not exists admin;
revoke all on schema admin from public, anon, authenticated;

create or replace view admin.all_users as
with practice as (
  select
    s.user_id,
    count(distinct s.id)                                            as sessions,
    count(distinct s.id) filter (where s.completed_at is not null)  as sessions_completed,
    count(a.id)                                                     as answers,
    max(s.started_at)                                               as last_practice
  from public.sessions s
  left join public.answers a on a.session_id = s.id
  group by s.user_id
),
latest_session as (
  -- Most recent browser session per user: what device they're on and when it last refreshed.
  select distinct on (user_id) user_id, user_agent, ip, updated_at
  from auth.sessions
  order by user_id, updated_at desc nulls last
)
select
  case when u.is_anonymous then 'Guest-' || upper(left(u.id::text, 6))
       else coalesce(u.email, u.raw_user_meta_data->>'display_name', u.id::text)
  end                                                         as who,
  case when not u.is_anonymous                then 'account'
       when coalesce(p.answers, 0) > 0        then 'guest'
       else                                        'guest (no activity)'
  end                                                         as status,
  -- An account that has a signup_source began as a guest and later saved their progress.
  (not u.is_anonymous and u.raw_user_meta_data ? 'signup_source') as converted_from_guest,
  u.raw_user_meta_data->>'signup_source'                      as came_in_via,
  u.raw_user_meta_data->>'display_name'                       as name,
  coalesce(p.sessions, 0)                                     as sessions,
  coalesce(p.sessions_completed, 0)                           as sessions_completed,
  coalesce(p.answers, 0)                                      as answers,
  concat_ws(' · ',
    case when ls.user_agent ilike '%iphone%'  then 'iPhone'
         when ls.user_agent ilike '%ipad%'    then 'iPad'
         when ls.user_agent ilike '%android%' then 'Android'
         when ls.user_agent ilike '%cros%'    then 'Chromebook'
         when ls.user_agent ilike '%mac os%'  then 'Mac'
         when ls.user_agent ilike '%windows%' then 'Windows'
         when ls.user_agent ilike '%linux%'   then 'Linux'
    end,
    case when ls.user_agent ilike '%edg/%'                                   then 'Edge'
         when ls.user_agent ilike '%chrome/%' or ls.user_agent ilike '%crios/%' then 'Chrome'
         when ls.user_agent ilike '%firefox/%' or ls.user_agent ilike '%fxios/%' then 'Firefox'
         when ls.user_agent ilike '%safari/%'                                then 'Safari'
    end
  )                                                           as device,
  host(ls.ip)                                                 as last_ip,
  u.created_at                                                as first_seen,
  greatest(u.last_sign_in_at, ls.updated_at, p.last_practice) as last_seen,
  u.id,
  ls.user_agent  -- kept last: `create or replace view` can only add columns at the end
from auth.users u
left join practice p        on p.user_id = u.id
left join latest_session ls on ls.user_id = u.id
order by last_seen desc nulls last;

create or replace view admin.users as
select * from admin.all_users where status <> 'guest (no activity)';

create or replace view admin.summary as
select
  count(*) filter (where status = 'account')               as accounts,
  count(*) filter (where converted_from_guest)             as converted_from_guest,
  count(*) filter (where status = 'guest')                 as active_guests,
  count(*) filter (where status = 'guest (no activity)')   as guests_no_activity,
  count(*) filter (where last_seen > now() - interval '7 days' and status <> 'guest (no activity)') as active_last_7_days
from admin.all_users;

-- User ids that are probably the same computer: same IP and the exact same browser string
-- (browser, version and OS), e.g. one student who used incognito or cleared cookies. A hint,
-- not proof: on school or library Wi-Fi, classmates on identical laptops share both, so check
-- first_seen/last_seen and activity before treating a group as one person. Users whose latest
-- session ended (signed out or expired) have no IP and can't be grouped.
create or replace view admin.likely_same_device as
select
  device,
  last_ip,
  count(*)                                          as user_ids,
  count(*) filter (where status <> 'account')       as guest_ids,
  array_agg(who order by first_seen)                as who,
  sum(answers)                                      as total_answers,
  min(first_seen)                                   as first_seen,
  max(last_seen)                                    as last_seen,
  array_agg(id order by first_seen)                 as ids
from admin.all_users
where last_ip is not null and user_agent is not null
group by device, last_ip, user_agent
having count(*) > 1
order by max(last_seen) desc;

revoke all on all tables in schema admin from public, anon, authenticated;
