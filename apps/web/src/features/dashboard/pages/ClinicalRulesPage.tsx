import { useState, type FormEvent } from 'react';
import type { ClinicalRuleCategory, ClinicalRuleListItem } from '@medscreen/types';
import { CLINICAL_RULE_TYPES } from '@medscreen/types';
import { ApiClientError } from '../../../shared/lib/api-client';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { ClinicalRuleFormDialog, type ClinicalRuleFormValues } from '../components/ClinicalRuleFormDialog';
import { ClinicalRuleHistoryDialog } from '../components/ClinicalRuleHistoryDialog';
import { ClinicalRulePreviewDialog } from '../components/ClinicalRulePreviewDialog';
import { ClinicalRulesTable } from '../components/ClinicalRulesTable';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import {
  useClinicalRules,
  useCreateClinicalRule,
  useDisableClinicalRule,
  useEnableClinicalRule,
  useUpdateClinicalRule,
} from '../hooks/useClinicalRules';
import { CLINICAL_RULE_CATEGORY_OPTIONS } from '../lib/clinical-rules-labels';

type EnabledFilter = 'all' | 'enabled' | 'disabled';

function resolveMutationError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Operațiunea nu a putut fi finalizată.';
}

export function ClinicalRulesPage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<ClinicalRuleCategory | 'all'>('all');
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  const [createOpen, setCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState<ClinicalRuleListItem | null>(null);
  const [toggleRule, setToggleRule] = useState<ClinicalRuleListItem | null>(null);
  const [historyRule, setHistoryRule] = useState<ClinicalRuleListItem | null | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useClinicalRules({
    search: appliedSearch,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    enabled: enabledFilter === 'all' ? undefined : enabledFilter === 'enabled',
    page,
    limit,
  });

  const createRule = useCreateClinicalRule();
  const updateRule = useUpdateClinicalRule();
  const enableRule = useEnableClinicalRule();
  const disableRule = useDisableClinicalRule();

  const pendingRuleId =
    updateRule.isPending && editRule
      ? editRule.id
      : enableRule.isPending && toggleRule
        ? toggleRule.id
        : disableRule.isPending && toggleRule
          ? toggleRule.id
          : null;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim() || undefined);
  };

  const handleCreate = async (values: ClinicalRuleFormValues) => {
    setFormError(null);
    try {
      await createRule.mutateAsync({
        code: values.code,
        name: values.name,
        category: values.category,
        severity: values.severity,
        rule_type: values.rule_type,
        threshold_key:
          values.rule_type === CLINICAL_RULE_TYPES.THRESHOLD ? values.threshold_key : null,
        threshold_value:
          values.rule_type === CLINICAL_RULE_TYPES.THRESHOLD && values.threshold_value
            ? Number(values.threshold_value)
            : null,
        threshold_unit:
          values.rule_type === CLINICAL_RULE_TYPES.THRESHOLD ? values.threshold_unit || null : null,
        recommendation_text:
          values.rule_type === CLINICAL_RULE_TYPES.RECOMMENDATION
            ? values.recommendation_text
            : null,
        enabled: true,
      });
      setCreateOpen(false);
    } catch (mutationError) {
      setFormError(resolveMutationError(mutationError));
    }
  };

  const handleEdit = async (values: ClinicalRuleFormValues) => {
    if (!editRule) return;

    setFormError(null);
    try {
      await updateRule.mutateAsync({
        ruleId: editRule.id,
        payload: {
          name: values.name,
          severity: values.severity,
          threshold_value:
            editRule.rule_type === CLINICAL_RULE_TYPES.THRESHOLD && values.threshold_value
              ? Number(values.threshold_value)
              : undefined,
          threshold_unit:
            editRule.rule_type === CLINICAL_RULE_TYPES.THRESHOLD
              ? values.threshold_unit || null
              : undefined,
          recommendation_text:
            editRule.rule_type === CLINICAL_RULE_TYPES.RECOMMENDATION
              ? values.recommendation_text
              : undefined,
        },
      });
      setEditRule(null);
    } catch (mutationError) {
      setFormError(resolveMutationError(mutationError));
    }
  };

  const handleConfirmToggle = async () => {
    if (!toggleRule) return;

    setToggleError(null);
    try {
      if (toggleRule.enabled) {
        await disableRule.mutateAsync(toggleRule.id);
      } else {
        await enableRule.mutateAsync(toggleRule.id);
      }
      setToggleRule(null);
    } catch (mutationError) {
      setToggleError(resolveMutationError(mutationError));
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Reguli Clinice"
        description="Administrați setul activ de praguri și reguli folosite de motorul clinic în evaluările de screening."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Previzualizare evaluare
            </button>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setCreateOpen(true);
              }}
              className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90"
            >
              Regulă nouă
            </button>
          </div>
        }
      />

      {data?.rule_set ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Set activ: <strong>{data.rule_set.name}</strong> · versiune set v{data.rule_set.version} · motor{' '}
          {data.rule_set.engine_version} · {data.rule_set.enabled_count}/{data.rule_set.rule_count} reguli
          active
        </div>
      ) : null}

      <form
        onSubmit={handleSearch}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-4"
      >
        <div className="lg:col-span-2">
          <label htmlFor="rules-search" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Căutare
          </label>
          <input
            id="rules-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nume sau cod regulă"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="rules-category" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Categorie
          </label>
          <select
            id="rules-category"
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value as ClinicalRuleCategory | 'all');
              setPage(1);
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          >
            <option value="all">Toate categoriile</option>
            {CLINICAL_RULE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rules-enabled" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            id="rules-enabled"
            value={enabledFilter}
            onChange={(event) => {
              setEnabledFilter(event.target.value as EnabledFilter);
              setPage(1);
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          >
            <option value="all">Toate</option>
            <option value="enabled">Active</option>
            <option value="disabled">Inactive</option>
          </select>
        </div>

        <div className="flex flex-wrap items-end gap-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90"
          >
            Aplică filtre
          </button>
          <button
            type="button"
            onClick={() => setHistoryRule(null)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Istoric complet
          </button>
          {isFetching ? <span className="text-sm text-slate-500">Se actualizează…</span> : null}
        </div>
      </form>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Se încarcă regulile clinice…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Regulile clinice nu au putut fi încărcate.'}
          <button
            type="button"
            onClick={() => void refetch()}
            className="ml-3 font-semibold underline"
          >
            Reîncearcă
          </button>
        </div>
      ) : null}

      {data ? (
        <>
          <ClinicalRulesTable
            rules={data.rules}
            pendingRuleId={pendingRuleId}
            onEdit={(rule) => {
              setFormError(null);
              setEditRule(rule);
            }}
            onToggleEnabled={setToggleRule}
            onViewHistory={setHistoryRule}
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              {data.total} regulă/reguli · pagina {data.page} din {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
              >
                Înapoi
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
              >
                Înainte
              </button>
            </div>
          </div>
        </>
      ) : null}

      {createOpen ? (
        <ClinicalRuleFormDialog
          mode="create"
          isPending={createRule.isPending}
          errorMessage={formError}
          onSubmit={handleCreate}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {editRule ? (
        <ClinicalRuleFormDialog
          mode="edit"
          rule={editRule}
          isPending={updateRule.isPending}
          errorMessage={formError}
          onSubmit={handleEdit}
          onClose={() => setEditRule(null)}
        />
      ) : null}

      {historyRule !== undefined ? (
        <ClinicalRuleHistoryDialog rule={historyRule} onClose={() => setHistoryRule(undefined)} />
      ) : null}

      {previewOpen ? <ClinicalRulePreviewDialog onClose={() => setPreviewOpen(false)} /> : null}

      {toggleRule ? (
        <ConfirmActionDialog
          title={toggleRule.enabled ? 'Dezactivare regulă' : 'Activare regulă'}
          description={
            <>
              <p>
                {toggleRule.enabled
                  ? `Regula „${toggleRule.name}” nu va mai fi aplicată în evaluările viitoare.`
                  : `Regula „${toggleRule.name}” va fi inclusă din nou în evaluările viitoare.`}
              </p>
              {toggleError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  {toggleError}
                </p>
              ) : null}
            </>
          }
          confirmLabel={toggleRule.enabled ? 'Dezactivează' : 'Activează'}
          confirmTone={toggleRule.enabled ? 'danger' : 'primary'}
          isPending={enableRule.isPending || disableRule.isPending}
          onConfirm={() => void handleConfirmToggle()}
          onCancel={() => {
            setToggleRule(null);
            setToggleError(null);
          }}
        />
      ) : null}
    </div>
  );
}
