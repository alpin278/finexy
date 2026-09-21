-- Phase 30.1: v2 backups add category allocations while retaining v1 imports.
-- The v1 routines are retained under private names so their established restore
-- order and idempotent source maps remain intact.
begin;

alter table public.backup_imports drop constraint backup_imports_version_check;
alter table public.backup_imports add constraint backup_imports_version_check check (backup_version in (1, 2));
alter table public.backup_record_maps drop constraint backup_record_maps_entity_check;
alter table public.backup_record_maps add constraint backup_record_maps_entity_check check (entity_type in ('wallet', 'category', 'category_rule', 'transaction', 'transfer', 'budget', 'recurring_rule', 'split'));

alter function public.finexy_export_backup() rename to finexy_export_backup_v1;
alter function public.finexy_import_backup(jsonb, text) rename to finexy_import_backup_v1;

create function public.finexy_export_backup()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_backup jsonb;
begin
  if v_user is null then raise exception using errcode = '42501', message = 'Authentication required.'; end if;
  v_backup := public.finexy_export_backup_v1();
  return v_backup || jsonb_build_object(
    'version', 2,
    'schema', jsonb_build_object('name', 'finexy', 'version', 'phase-30.1'),
    'transaction_splits', coalesce((
      select jsonb_agg(jsonb_build_object(
        'ref', 'split_' || substr(encode(extensions.digest(s.id::text, 'sha256'), 'hex'), 1, 24),
        'transaction_ref', 'transaction_' || substr(encode(extensions.digest(s.transaction_id::text, 'sha256'), 'hex'), 1, 24),
        'category_ref', 'category_' || substr(encode(extensions.digest(s.category_id::text, 'sha256'), 'hex'), 1, 24),
        'amount', s.amount::text, 'note', s.note
      ) order by s.transaction_id, s.created_at, s.id)
      from public.transaction_splits s where s.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

create function public.finexy_import_backup(p_backup jsonb, p_mode text default 'merge')
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid(); v_version integer; v_backup_key text; v_existing jsonb; v_base jsonb; v_summary jsonb;
  v_split jsonb; v_parent jsonb; v_ref text; v_fp text; v_parent_id uuid; v_category_id uuid; v_existing_id uuid; v_existing_fp text;
  v_total numeric; v_count integer; v_split_count integer := 0;
begin
  if v_user is null then raise exception using errcode = '42501', message = 'Authentication required.'; end if;
  if p_backup is null or jsonb_typeof(p_backup) <> 'object' or p_backup->>'format' <> 'finexy-backup' then raise exception using errcode = '22023', message = 'Unsupported backup format.'; end if;
  if coalesce(p_backup->>'version', '') !~ '^[0-9]+$' then raise exception using errcode = '22023', message = 'Unsupported backup version.'; end if;
  v_version := (p_backup->>'version')::integer;
  if v_version = 1 then return public.finexy_import_backup_v1(p_backup, p_mode); end if;
  if v_version <> 2 then raise exception using errcode = '22023', message = format('Unsupported backup version: %s.', v_version); end if;
  if jsonb_typeof(p_backup->'transaction_splits') <> 'array' then raise exception using errcode = '22023', message = 'Transaction splits must be an array for backup v2.'; end if;
  v_backup_key := encode(extensions.digest(p_backup::text, 'sha256'), 'hex');
  select summary into v_existing from public.backup_imports where user_id=v_user and backup_key=v_backup_key;
  if v_existing is not null then return v_existing || jsonb_build_object('already_imported', true); end if;

  -- Validate the complete allocation set before the v1 restore creates any rows.
  for v_parent in select value from jsonb_array_elements(p_backup->'transactions') elements(value) loop
    if v_parent->>'ref' !~ '^transaction_[A-Za-z0-9_-]{1,150}$' then raise exception using errcode='22023', message='Transaction reference is invalid.'; end if;
    select count(*), coalesce(sum((s.value->>'amount')::numeric), 0) into v_count, v_total
      from jsonb_array_elements(p_backup->'transaction_splits') s(value) where s.value->>'transaction_ref'=v_parent->>'ref';
    if v_count > 0 and (v_parent->>'type' = 'transfer' or v_count < 2 or v_total <> (v_parent->>'amount')::numeric) then raise exception using errcode='22023', message='Split allocations must be non-transfer, contain at least two rows, and equal their parent total.'; end if;
  end loop;
  for v_split in select value from jsonb_array_elements(p_backup->'transaction_splits') elements(value) loop
    v_ref := v_split->>'ref';
    if v_ref !~ '^split_[A-Za-z0-9_-]{1,150}$' or coalesce(v_split->>'amount','') !~ '^[0-9]+(\\.[0-9]{1,4})?$' or (v_split->>'amount')::numeric <= 0 then raise exception using errcode='22023', message='Split reference or amount is invalid.'; end if;
    select value into v_parent from jsonb_array_elements(p_backup->'transactions') elements(value) where value->>'ref'=v_split->>'transaction_ref';
    if v_parent is null or v_parent->>'type' = 'transfer' then raise exception using errcode='22023', message='Split parent transaction is invalid.'; end if;
    if not exists (select 1 from jsonb_array_elements(p_backup->'categories') elements(value) where value->>'ref'=v_split->>'category_ref' and value->>'type'=v_parent->>'type' and value->>'status'='active' and coalesce(value->>'archived_at','')='') then raise exception using errcode='22023', message='Split category is invalid.'; end if;
  end loop;

  v_base := (p_backup - 'transaction_splits') || jsonb_build_object('version', 1);
  v_summary := public.finexy_import_backup_v1(v_base, p_mode);
  for v_split in select value from jsonb_array_elements(p_backup->'transaction_splits') elements(value) loop
    v_ref := v_split->>'ref'; v_fp := encode(extensions.digest(v_split::text, 'sha256'), 'hex');
    select target_id, source_fingerprint into v_existing_id, v_existing_fp from public.backup_record_maps where user_id=v_user and entity_type='split' and source_ref=v_ref;
    if v_existing_id is not null then if v_existing_fp <> v_fp then raise exception using errcode='22023', message='Split reference does not match its prior import.'; end if; continue; end if;
    select target_id into v_parent_id from public.backup_record_maps where user_id=v_user and entity_type='transaction' and source_ref=v_split->>'transaction_ref';
    select target_id into v_category_id from public.backup_record_maps where user_id=v_user and entity_type='category' and source_ref=v_split->>'category_ref';
    if v_parent_id is null or v_category_id is null then raise exception using errcode='22023', message='Split relationship mapping is invalid.'; end if;
    insert into public.transaction_splits(user_id, transaction_id, category_id, amount, note) values (v_user, v_parent_id, v_category_id, (v_split->>'amount')::numeric, nullif(v_split->>'note','')) returning id into v_existing_id;
    insert into public.backup_record_maps(user_id, entity_type, source_ref, source_fingerprint, target_id) values (v_user, 'split', v_ref, v_fp, v_existing_id);
    v_split_count := v_split_count + 1;
  end loop;
  v_summary := v_summary || jsonb_build_object('version', 2, 'splits', v_split_count, 'already_imported', false);
  insert into public.backup_imports(user_id, backup_key, backup_version, mode, summary) values (v_user, v_backup_key, 2, lower(trim(coalesce(p_mode, 'merge'))), v_summary);
  return v_summary;
end;
$$;

revoke all on function public.finexy_export_backup() from public, anon;
revoke all on function public.finexy_import_backup(jsonb, text) from public, anon;
grant execute on function public.finexy_export_backup() to authenticated;
grant execute on function public.finexy_import_backup(jsonb, text) to authenticated;

commit;
