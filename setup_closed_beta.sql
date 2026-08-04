-- InkWellMedia controlled closed beta
-- Apply to a disposable/staging Supabase project first. This migration does not
-- enable payments and deliberately revokes browser writes to financial tables.

create extension if not exists pgcrypto;

create table if not exists public.beta_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('member', 'creator', 'admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.beta_creator_applications (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null,
  niche text not null check (char_length(niche) between 1 and 80),
  portfolio_url text,
  bio text not null check (char_length(bio) between 30 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  attribution jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_note text
);
create unique index if not exists beta_creator_application_pending_email
  on public.beta_creator_applications (lower(email)) where status = 'pending';

create table if not exists public.beta_invitations (
  id uuid primary key default gen_random_uuid(),
  code_hash bytea not null unique,
  kind text not null check (kind in ('member', 'creator')),
  email text,
  creator_user_id uuid references auth.users(id),
  application_id uuid references public.beta_creator_applications(id),
  campaign text,
  max_uses integer not null default 1 check (max_uses between 1 and 500),
  use_count integer not null default 0 check (use_count >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  disabled_at timestamptz
);

create table if not exists public.beta_registrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  invitation_id uuid not null references public.beta_invitations(id),
  attributed_creator_id uuid references auth.users(id),
  attribution jsonb not null default '{}'::jsonb,
  registered_at timestamptz not null default now()
);

create table if not exists public.beta_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  audience text not null default 'member' check (audience in ('member', 'creator')),
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists beta_waitlist_email_audience
  on public.beta_waitlist (lower(email), audience);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  category text not null check (category in ('bug', 'content', 'safety', 'accessibility', 'idea', 'other')),
  page_url text,
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.beta_analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  attribution jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists beta_analytics_event_time
  on public.beta_analytics_events(event_name, occurred_at desc);

alter table public.beta_user_roles enable row level security;
alter table public.beta_creator_applications enable row level security;
alter table public.beta_invitations enable row level security;
alter table public.beta_registrations enable row level security;
alter table public.beta_waitlist enable row level security;
alter table public.beta_feedback enable row level security;
alter table public.beta_analytics_events enable row level security;

-- No direct table policies are created. Access is intentionally RPC-only.
revoke all on public.beta_user_roles, public.beta_creator_applications,
  public.beta_invitations, public.beta_registrations, public.beta_waitlist,
  public.beta_feedback, public.beta_analytics_events from anon, authenticated;

create or replace function public.is_beta_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.beta_user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_beta_role()
returns text language sql stable security definer set search_path = public
as $$
  select role from public.beta_user_roles where user_id = auth.uid();
$$;

create or replace function public.submit_creator_application(
  p_first_name text, p_last_name text, p_email text, p_niche text,
  p_portfolio_url text, p_bio text, p_attribution jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.';
  end if;
  insert into public.beta_creator_applications
    (first_name,last_name,email,niche,portfolio_url,bio,attribution)
  values
    (trim(p_first_name),trim(p_last_name),lower(trim(p_email)),trim(p_niche),
     nullif(trim(p_portfolio_url),''),trim(p_bio),coalesce(p_attribution,'{}'::jsonb))
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'An application for this email is already being reviewed.';
end;
$$;

create or replace function public.join_beta_waitlist(
  p_email text, p_audience text default 'member', p_attribution jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public
as $$
begin
  if p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.';
  end if;
  insert into public.beta_waitlist(email,audience,attribution)
  values(lower(trim(p_email)),p_audience,coalesce(p_attribution,'{}'::jsonb))
  on conflict (lower(email), audience) do update
    set attribution = excluded.attribution;
end;
$$;

create or replace function public.submit_beta_feedback(
  p_email text, p_category text, p_page_url text, p_message text
) returns uuid language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.beta_feedback(user_id,email,category,page_url,message)
  values(auth.uid(),nullif(lower(trim(p_email)),''),p_category,left(p_page_url,500),trim(p_message))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.track_beta_event(
  p_event_name text, p_metadata jsonb default '{}'::jsonb,
  p_attribution jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public
as $$
begin
  if p_event_name not in (
    'landing_view','explore_view','creator_profile_view',
    'creator_application_started','creator_application_submitted',
    'member_signup_started','member_signup_completed','invite_link_opened',
    'content_preview_opened'
  ) then raise exception 'Unsupported analytics event.'; end if;
  if pg_column_size(p_metadata) > 4096 or pg_column_size(p_attribution) > 4096 then
    raise exception 'Analytics payload too large.';
  end if;
  insert into public.beta_analytics_events(user_id,event_name,metadata,attribution)
  values(auth.uid(),p_event_name,coalesce(p_metadata,'{}'::jsonb),coalesce(p_attribution,'{}'::jsonb));
end;
$$;

create or replace function public.create_beta_invitation(
  p_kind text, p_email text default null, p_creator_user_id uuid default null,
  p_application_id uuid default null, p_campaign text default 'founding-beta',
  p_max_uses integer default 1, p_expires_in_days integer default 14
) returns text language plpgsql security definer set search_path = public
as $$
declare v_code text := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
begin
  if not public.is_beta_admin() then raise exception 'Admin access required.'; end if;
  insert into public.beta_invitations
    (code_hash,kind,email,creator_user_id,application_id,campaign,max_uses,expires_at,created_by)
  values
    (digest(v_code,'sha256'),p_kind,nullif(lower(trim(p_email)),''),p_creator_user_id,
     p_application_id,left(p_campaign,120),p_max_uses,now() + make_interval(days => p_expires_in_days),auth.uid());
  return v_code;
end;
$$;

create or replace function public.validate_beta_invitation(p_code text, p_email text)
returns jsonb language sql stable security definer set search_path = public
as $$
  select jsonb_build_object('valid',true,'kind',kind,'campaign',campaign)
  from public.beta_invitations
  where code_hash = digest(p_code,'sha256')
    and disabled_at is null and expires_at > now() and use_count < max_uses
    and (email is null or lower(email) = lower(trim(p_email)))
  limit 1;
$$;

create or replace function public.approve_creator_application(p_application_id uuid, p_note text default null)
returns text language plpgsql security definer set search_path = public
as $$
declare v_email text; v_code text;
begin
  if not public.is_beta_admin() then raise exception 'Admin access required.'; end if;
  update public.beta_creator_applications
    set status='approved',reviewed_at=now(),reviewed_by=auth.uid(),review_note=p_note
    where id=p_application_id and status='pending'
    returning email into v_email;
  if v_email is null then raise exception 'Pending application not found.'; end if;
  v_code := public.create_beta_invitation('creator',v_email,null,p_application_id,'founding-creator',1,30);
  return v_code;
end;
$$;

create or replace function public.reject_creator_application(p_application_id uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_beta_admin() then raise exception 'Admin access required.'; end if;
  update public.beta_creator_applications
    set status='rejected',reviewed_at=now(),reviewed_by=auth.uid(),review_note=p_note
    where id=p_application_id and status='pending';
end;
$$;

create or replace function public.consume_beta_invitation()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_code text; v_inv public.beta_invitations%rowtype; v_role text;
begin
  v_code := new.raw_user_meta_data->>'invite_code';
  if v_code is null then raise exception 'A valid closed-beta invitation is required.'; end if;
  select * into v_inv from public.beta_invitations
    where code_hash=digest(v_code,'sha256') and disabled_at is null
      and expires_at > now() and use_count < max_uses
      and (email is null or lower(email)=lower(new.email))
    for update;
  if not found then raise exception 'This invitation is invalid, expired, or already used.'; end if;
  update public.beta_invitations set use_count=use_count+1 where id=v_inv.id;
  v_role := case when v_inv.kind='creator' then 'creator' else 'member' end;
  insert into public.beta_user_roles(user_id,role,created_by) values(new.id,v_role,v_inv.created_by);
  insert into public.beta_registrations(user_id,invitation_id,attributed_creator_id,attribution)
  values(new.id,v_inv.id,v_inv.creator_user_id,coalesce(new.raw_user_meta_data->'attribution','{}'::jsonb));
  return new;
end;
$$;

drop trigger if exists on_beta_auth_user_created on auth.users;
create trigger on_beta_auth_user_created after insert on auth.users
  for each row execute procedure public.consume_beta_invitation();

create or replace function public.get_beta_admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_beta_admin() then raise exception 'Admin access required.'; end if;
  return jsonb_build_object(
    'counts',jsonb_build_object(
      'applications',(select count(*) from public.beta_creator_applications),
      'approved_creators',(select count(*) from public.beta_creator_applications where status='approved'),
      'invitations',(select count(*) from public.beta_invitations),
      'registrations',(select count(*) from public.beta_registrations),
      'activated',(select count(distinct user_id) from public.beta_analytics_events where event_name in ('explore_view','creator_profile_view','content_preview_opened'))
    ),
    'applications',(select coalesce(jsonb_agg(to_jsonb(a) order by submitted_at desc),'[]'::jsonb) from public.beta_creator_applications a),
    'invitations',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'email',email,'campaign',campaign,'use_count',use_count,'max_uses',max_uses,'expires_at',expires_at,'created_at',created_at) order by created_at desc),'[]'::jsonb) from public.beta_invitations),
    'registrations',(select coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'invitation_id',invitation_id,'registered_at',registered_at) order by registered_at desc),'[]'::jsonb) from public.beta_registrations)
  );
end;
$$;

grant execute on function public.is_beta_admin() to authenticated;
grant execute on function public.current_beta_role() to authenticated;
grant execute on function public.submit_creator_application(text,text,text,text,text,text,jsonb) to anon, authenticated;
grant execute on function public.join_beta_waitlist(text,text,jsonb) to anon, authenticated;
grant execute on function public.submit_beta_feedback(text,text,text,text) to anon, authenticated;
grant execute on function public.track_beta_event(text,jsonb,jsonb) to anon, authenticated;
grant execute on function public.validate_beta_invitation(text,text) to anon, authenticated;
grant execute on function public.create_beta_invitation(text,text,uuid,uuid,text,integer,integer) to authenticated;
grant execute on function public.approve_creator_application(uuid,text) to authenticated;
grant execute on function public.reject_creator_application(uuid,text) to authenticated;
grant execute on function public.get_beta_admin_dashboard() to authenticated;

-- Closed-beta kill switch: browser roles cannot mutate money even if legacy UI
-- calls remain cached. Keep SELECT grants/policies unchanged for historical views.
do $$
declare t text;
begin
  foreach t in array array['user_balances','deposits','purchases','subscriptions','payouts','products'] loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke insert, update, delete, truncate on table public.%I from anon, authenticated',t);
    end if;
  end loop;
end $$;

-- Bootstrap the first admin manually in the SQL editor after verifying the UUID:
-- insert into public.beta_user_roles(user_id,role) values ('<verified auth user uuid>','admin');


-- Closed-beta signup hardening (idempotent staging upgrade).
alter table public.beta_waitlist add column if not exists status text not null default 'pending';
alter table public.beta_waitlist add column if not exists reviewed_at timestamptz;
alter table public.beta_waitlist add column if not exists reviewed_by uuid references auth.users(id);
alter table public.beta_waitlist add column if not exists review_note text;
create or replace function public.validate_beta_invitation(p_code text,p_email text) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v public.beta_invitations%rowtype; begin
 select * into v from public.beta_invitations where code_hash=digest(trim(p_code),'sha256') limit 1;
 if not found or v.disabled_at is not null then return jsonb_build_object('valid',false,'reason','invalid');
 elsif v.use_count>=v.max_uses then return jsonb_build_object('valid',false,'reason','used');
 elsif v.expires_at<=now() then return jsonb_build_object('valid',false,'reason','expired');
 elsif v.email is not null and lower(v.email)<>lower(trim(p_email)) then return jsonb_build_object('valid',false,'reason','email_mismatch'); end if;
 return jsonb_build_object('valid',true,'kind',v.kind,'campaign',v.campaign); end $$;
create or replace function public.approve_member_request(p_request_id uuid,p_note text default null) returns text language plpgsql security definer set search_path=public as $$
declare e text;c text; begin if not public.is_beta_admin() then raise exception 'Admin access required.'; end if;
 update public.beta_waitlist set status='approved',reviewed_at=now(),reviewed_by=auth.uid(),review_note=p_note where id=p_request_id and audience='member' and status='pending' returning email into e;
 if e is null then raise exception 'Pending member request not found.'; end if; c:=public.create_beta_invitation('member',e,null,null,'founding-beta',1,14); return c; end $$;
create or replace function public.decline_member_request(p_request_id uuid,p_note text default null) returns void language plpgsql security definer set search_path=public as $$
begin if not public.is_beta_admin() then raise exception 'Admin access required.'; end if;
 update public.beta_waitlist set status='declined',reviewed_at=now(),reviewed_by=auth.uid(),review_note=p_note where id=p_request_id and audience='member' and status='pending';
 if not found then raise exception 'Pending member request not found.'; end if; end $$;
create or replace function public.get_beta_admin_dashboard() returns jsonb language plpgsql stable security definer set search_path=public as $$
begin if not public.is_beta_admin() then raise exception 'Admin access required.'; end if; return jsonb_build_object(
 'counts',jsonb_build_object('applications',(select count(*) from public.beta_creator_applications),'member_requests',(select count(*) from public.beta_waitlist where audience='member'),'approved_creators',(select count(*) from public.beta_creator_applications where status='approved'),'invitations',(select count(*) from public.beta_invitations),'registrations',(select count(*) from public.beta_registrations)),
 'applications',(select coalesce(jsonb_agg(to_jsonb(a) order by submitted_at desc),'[]') from public.beta_creator_applications a),
 'member_requests',(select coalesce(jsonb_agg(to_jsonb(w) order by created_at desc),'[]') from public.beta_waitlist w where audience='member'),
 'invitations',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'email',email,'use_count',use_count,'max_uses',max_uses,'expires_at',expires_at) order by created_at desc),'[]') from public.beta_invitations),
 'registrations',(select coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'registered_at',registered_at) order by registered_at desc),'[]') from public.beta_registrations)); end $$;
grant execute on function public.approve_member_request(uuid,text) to authenticated;
grant execute on function public.decline_member_request(uuid,text) to authenticated;
revoke all on public.beta_user_roles,public.beta_invitations,public.beta_registrations from anon,authenticated;
grant execute on function public.current_beta_role() to authenticated;
alter table public.beta_invitations drop constraint if exists beta_invitations_single_use;
alter table public.beta_invitations add constraint beta_invitations_single_use check (max_uses=1) not valid;
