-- Lockcopy — 0011: logo uploads + clients can remove their own files.
begin;

-- Before running: create a PUBLIC bucket named `brand-logos` in Storage (2 MB, PNG/JPG/WebP/SVG).
-- Path: <org_id>/<file>
drop policy if exists "agency uploads its logo" on storage.objects;
create policy "agency uploads its logo" on storage.objects for insert to authenticated
with check (bucket_id = 'brand-logos' and public.is_org_member(((storage.foldername(name))[1])::uuid));

drop policy if exists "agency replaces its logo" on storage.objects;
create policy "agency replaces its logo" on storage.objects for update to authenticated
using (bucket_id = 'brand-logos' and public.is_org_member(((storage.foldername(name))[1])::uuid));

drop policy if exists "agency deletes its logo" on storage.objects;
create policy "agency deletes its logo" on storage.objects for delete to authenticated
using (bucket_id = 'brand-logos' and public.is_org_member(((storage.foldername(name))[1])::uuid));

-- Client removes a file it uploaded by mistake (only while the field is not approved).
create or replace function public.portal_remove_file(_token uuid, _file uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.requests;
  ff public.submission_files;
begin
  select * into r from public.requests where token = _token;
  if not found or r.revoked_at is not null or r.expires_at <= now() or r.status = 'archived' then
    raise exception 'link_invalido' using errcode = '42501';
  end if;
  select * into ff from public.submission_files where id = _file and request_id = r.id;
  if not found then
    raise exception 'ficheiro_invalido' using errcode = '42501';
  end if;
  if exists (select 1 from public.submissions where field_id = ff.field_id and status = 'approved') then
    raise exception 'campo_trancado' using errcode = '42501';
  end if;
  delete from public.submission_files where id = ff.id;
  if not exists (select 1 from public.submission_files where field_id = ff.field_id and request_id = r.id) then
    update public.submissions set status = 'pending'
    where field_id = ff.field_id and request_id = r.id and coalesce(value_text, '') = '' and status <> 'approved';
  end if;
  insert into public.request_events (request_id, org_id, actor, kind, detail)
  values (r.id, r.org_id, 'client', 'file_removed', jsonb_build_object('name', ff.file_name));
  return jsonb_build_object('paths', jsonb_build_array(ff.storage_path, ff.webp_storage_path));
end;
$$;

revoke execute on function public.portal_remove_file(uuid, uuid) from public;
grant execute on function public.portal_remove_file(uuid, uuid) to anon, authenticated, service_role;

-- Client may delete the storage objects inside its own link folder.
drop policy if exists "client removes from its link" on storage.objects;
create policy "client removes from its link" on storage.objects for delete to anon
using (bucket_id = 'client-uploads' and public.path_matches_token(name));

commit;
