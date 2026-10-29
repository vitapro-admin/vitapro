-- Superadmin: účet, ktorý sa cez web nedá zablokovať, zmeniť ani zmazať.
-- Meniť ho môže len priamo SQL Editor v Supabase (rola postgres).
-- Web pracuje ako service_role/authenticated, preto ho tieto pravidlá zastavia.
alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

create or replace function public.protect_superadmin()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    if old.is_superadmin then
      raise exception 'Superadmin sa dá zmazať len priamo v Supabase (SQL Editor).';
    end if;
    return old;
  end if;
  if new.is_superadmin is distinct from old.is_superadmin then
    raise exception 'Príznak superadmin sa dá meniť len priamo v Supabase (SQL Editor).';
  end if;
  if old.is_superadmin and (new.role, new.status, new.email) is distinct from (old.role, old.status, old.email) then
    raise exception 'Superadmin sa dá meniť len priamo v Supabase (SQL Editor).';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_superadmin on public.profiles;
create trigger profiles_protect_superadmin
  before update or delete on public.profiles
  for each row execute function public.protect_superadmin();

-- Zablokuje aj zmazanie prihlasovacieho účtu (napr. cez API alebo tlačidlo
-- Delete user v Authentication). Zmazanie superadmina: v SQL Editore najprv
--   update public.profiles set is_superadmin = false where email = '…';
-- a až potom ho zmazať.
create or replace function public.protect_superadmin_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles p where p.id = old.id and p.is_superadmin) then
    raise exception 'Superadmin sa dá zmazať len po zrušení príznaku is_superadmin v SQL Editore.';
  end if;
  return old;
end;
$$;

drop trigger if exists on_auth_user_delete_protect_superadmin on auth.users;
create trigger on_auth_user_delete_protect_superadmin
  before delete on auth.users
  for each row execute function public.protect_superadmin_user();

-- Hlavný účet VITAPRO.
update public.profiles
set is_superadmin = true, role = 'admin', status = 'approved'
where email = 'vitaproadmin@gmail.com';
