-- =====================================================================
-- Lockcopy — 0005 políticas de armazenamento
-- Bucket `client-uploads` (privado) criado antes: ver db/README.md.
-- Caminho obrigatório: <org_id>/<token>/<field_id>/<nome-do-ficheiro>
-- =====================================================================

begin;

-- O cliente final só escreve dentro da pasta do próprio link.
create policy "cliente envia para o seu link"
on storage.objects for insert to anon
with check (
  bucket_id = 'client-uploads'
  and public.path_matches_token(name)
);

-- E só lê o que está na pasta desse link.
create policy "cliente le o seu link"
on storage.objects for select to anon
using (
  bucket_id = 'client-uploads'
  and public.path_matches_token(name)
);

-- A agência lê e gere tudo dentro das suas pastas.
create policy "agencia le os seus ficheiros"
on storage.objects for select to authenticated
using (
  bucket_id = 'client-uploads'
  and public.is_org_member(public.org_from_path(name))
);

create policy "agencia altera os seus ficheiros"
on storage.objects for update to authenticated
using (
  bucket_id = 'client-uploads'
  and public.is_org_member(public.org_from_path(name))
)
with check (
  bucket_id = 'client-uploads'
  and public.is_org_member(public.org_from_path(name))
);

create policy "agencia apaga os seus ficheiros"
on storage.objects for delete to authenticated
using (
  bucket_id = 'client-uploads'
  and public.is_org_member(public.org_from_path(name))
);

-- `service_role` ignora RLS: trata de URLs assinadas e da purga.

commit;
