-- =====================================================================
-- Lockcopy — 0003 políticas de RLS (isolamento por organização)
-- O cliente final não tem políticas aqui: só passa pelas funções de 0004.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Catálogo público (limites e modelos)
-- ---------------------------------------------------------------------
create policy "limites visiveis"
on public.plan_limits for select to authenticated
using (auth.uid() is not null);

create policy "modelos ativos visiveis"
on public.templates for select to anon, authenticated
using (is_active);

create policy "seccoes de modelos ativos"
on public.template_sections for select to anon, authenticated
using (exists (select 1 from public.templates t where t.id = template_id and t.is_active));

create policy "campos de modelos ativos"
on public.template_fields for select to anon, authenticated
using (exists (
  select 1 from public.template_sections s
  join public.templates t on t.id = s.template_id
  where s.id = section_id and t.is_active
));

-- ---------------------------------------------------------------------
-- Organizações
-- ---------------------------------------------------------------------
create policy "membros leem a organizacao"
on public.organizations for select to authenticated
using (public.is_org_member(id));

-- Qualquer utilizador autenticado abre a sua própria agência;
-- um trigger torna-o proprietário (0004).
create policy "criar organizacao propria"
on public.organizations for insert to authenticated
with check (auth.uid() is not null and storage_used_bytes = 0);

create policy "proprietario altera a organizacao"
on public.organizations for update to authenticated
using (public.org_has_role(id, 'owner'))
with check (public.org_has_role(id, 'owner'));

-- Sem política de delete: apagar conta é trabalho do servidor.

-- ---------------------------------------------------------------------
-- Membros
-- ---------------------------------------------------------------------
create policy "membros veem o seu equipo"
on public.org_members for select to authenticated
using (public.is_org_member(org_id));

create policy "proprietario convida membros"
on public.org_members for insert to authenticated
with check (public.org_has_role(org_id, 'owner'));

create policy "membros editam preferencias, proprietario edita tudo"
on public.org_members for update to authenticated
using (public.org_has_role(org_id, 'owner') or user_id = auth.uid())
with check (public.org_has_role(org_id, 'owner') or user_id = auth.uid());

create policy "membro sai, proprietario remove"
on public.org_members for delete to authenticated
using (public.org_has_role(org_id, 'owner') or user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create policy "agencia le os seus pedidos"
on public.requests for select to authenticated
using (public.is_org_member(org_id));

create policy "agencia cria pedidos"
on public.requests for insert to authenticated
with check (public.is_org_member(org_id));

create policy "agencia altera os seus pedidos"
on public.requests for update to authenticated
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create policy "proprietario apaga pedidos"
on public.requests for delete to authenticated
using (public.org_has_role(org_id, 'owner'));

-- ---------------------------------------------------------------------
-- Secções e campos
-- ---------------------------------------------------------------------
create policy "le seccoes do pedido"
on public.sections for select to authenticated
using (public.request_in_org(request_id));

create policy "cria seccoes do pedido"
on public.sections for insert to authenticated
with check (public.request_in_org(request_id));

create policy "altera seccoes do pedido"
on public.sections for update to authenticated
using (public.request_in_org(request_id))
with check (public.request_in_org(request_id));

create policy "apaga seccoes do pedido"
on public.sections for delete to authenticated
using (public.request_in_org(request_id));

-- `fields` não tem request_id: sobe pela secção.
create policy "le campos do pedido"
on public.fields for select to authenticated
using (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
));

create policy "cria campos do pedido"
on public.fields for insert to authenticated
with check (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
));

create policy "altera campos do pedido"
on public.fields for update to authenticated
using (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
))
with check (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
));

create policy "apaga campos do pedido"
on public.fields for delete to authenticated
using (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
));

-- ---------------------------------------------------------------------
-- Respostas
-- ---------------------------------------------------------------------
create policy "agencia le respostas"
on public.submissions for select to authenticated
using (public.request_in_org(request_id));

create policy "agencia corrige respostas"
on public.submissions for insert to authenticated
with check (public.request_in_org(request_id));

create policy "agencia altera respostas"
on public.submissions for update to authenticated
using (public.request_in_org(request_id))
with check (public.request_in_org(request_id));

create policy "agencia apaga respostas"
on public.submissions for delete to authenticated
using (public.request_in_org(request_id));

-- ---------------------------------------------------------------------
-- Anexos (leitura e remoção pela agência; entrada só pelo portal)
-- ---------------------------------------------------------------------
create policy "agencia le anexos"
on public.submission_files for select to authenticated
using (public.request_in_org(request_id));

create policy "agencia marca anexos"
on public.submission_files for update to authenticated
using (public.request_in_org(request_id))
with check (public.request_in_org(request_id));

create policy "agencia apaga anexos"
on public.submission_files for delete to authenticated
using (public.request_in_org(request_id));

-- ---------------------------------------------------------------------
-- Histórico
-- ---------------------------------------------------------------------
create policy "le historico do pedido"
on public.request_events for select to authenticated
using (public.request_in_org(request_id));

create policy "registra eventos do pedido"
on public.request_events for insert to authenticated
with check (public.request_in_org(request_id));

-- ---------------------------------------------------------------------
-- Notificações, subscrição e purga: leitura pela agência, escrita do servidor
-- ---------------------------------------------------------------------
create policy "agencia ve as suas notificacoes"
on public.notifications for select to authenticated
using (public.is_org_member(org_id));

create policy "agencia ve eventos de subscricao"
on public.subscription_events for select to authenticated
using (org_id is not null and public.is_org_member(org_id));

create policy "agencia ve a fila de purga"
on public.deletion_jobs for select to authenticated
using (public.is_org_member(org_id));

commit;
