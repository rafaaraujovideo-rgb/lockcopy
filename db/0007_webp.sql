-- 0007_webp.sql — anexar a versão WebP gerada no browser ao ficheiro original.
-- Correr no SQL Editor do Supabase DEPOIS dos ficheiros 0001–0006 (ou do ALL_IN_ONE).
--
-- Contexto: a conversão para WebP é feita no browser do cliente (canvas), o
-- original é sempre preservado, e esta RPC regista o caminho do WebP no ficheiro
-- já registado — validando o token do portal como as restantes funções do portal.

begin;

create or replace function public.portal_attach_webp(
  _token uuid,
  _file uuid,
  _webp_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.requests;
  f public.submission_files;
  prefix text;
begin
  select * into r from public.requests where token = _token;

  if not found or r.revoked_at is not null or r.expires_at <= now() or r.status = 'archived' then
    raise exception 'link_invalido — este link já não está disponível.'
      using errcode = '42501';
  end if;

  select * into f from public.submission_files where id = _file and request_id = r.id;
  if not found then
    raise exception 'ficheiro_inexistente — ficheiro não pertence a este pedido.'
      using errcode = '42501';
  end if;

  prefix := r.org_id || '/' || r.token || '/';
  if _webp_path is null
     or left(_webp_path, char_length(prefix)) <> prefix
     or right(lower(_webp_path), 5) <> '.webp' then
    raise exception 'caminho_invalido — caminho WebP não corresponde ao pedido.'
      using errcode = '42501';
  end if;

  update public.submission_files
  set webp_storage_path = _webp_path,
      image_status = 'done'::public.image_status,
      image_error = null
  where id = f.id;
end;
$$;

revoke execute on function public.portal_attach_webp(uuid, uuid, text) from public;
grant execute on function public.portal_attach_webp(uuid, uuid, text) to anon, authenticated, service_role;

commit;
