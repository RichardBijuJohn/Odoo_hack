import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowUp, BarChart3, CalendarDays, ChevronLeft, ChevronRight,
  Clock3, Download, FileDown, FileSpreadsheet, FileText, LoaderCircle,
  Printer, RefreshCw, Search, Users,
} from 'lucide-react'
import API from '../../services/api'
import ErrorMessage from '../../components/ErrorMessage'
import PageHeader from '../../components/PageHeader'
import { columnLabel, createReportExport, reportColumns, saveBlob } from './reportExports'

const reportTypes = [
  ['summary', 'Summary'], ['detailed', 'Detailed'], ['daily', 'Daily'],
  ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['custom', 'Custom'],
]
const entities = [
  ['overview', 'Project overview'], ['customers', 'Customers'], ['subscriptions', 'Subscriptions'],
  ['products', 'Products'], ['plans', 'Plans'], ['invoices', 'Invoices'],
  ['payments', 'Payments'], ['discounts', 'Discounts'], ['staff', 'Staff'],
]
const statuses = {
  customers: ['active', 'inactive', 'lead'],
  subscriptions: ['active', 'trial', 'paused', 'canceled', 'expired'],
  products: ['active', 'archived'],
  plans: ['active', 'archived'],
  invoices: ['draft', 'confirmed', 'paid', 'cancelled'],
  payments: ['completed', 'pending', 'failed', 'refunded'],
  discounts: ['active', 'expired', 'disabled'],
  staff: ['active', 'inactive'],
}
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))
const readableError = (error) => error?.message || (typeof error === 'string' ? error : 'Request failed. Please try again.')
const dateOnly = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
}

function normalizedReport(report) {
  return {
    ...report,
    generated_at: report.generated_at || report.created_at,
    filters: report.filters || JSON.parse(report.filters_json || '{}'),
    summary: report.summary || JSON.parse(report.summary_json || '{}'),
    data: report.data || JSON.parse(report.data_json || '[]'),
  }
}

function ActivityChart({ activity = [] }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return { key, count: Number(activity.find((entry) => String(entry.report_date).slice(0, 10) === key)?.count || 0) }
  })
  const max = Math.max(...days.map((day) => day.count), 1)

  return (
    <div className="flex h-36 items-end gap-3 border-b border-slate-200 px-2 pb-1" aria-label="Reports generated over the last seven days">
      {days.map((day) => (
        <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-xs tabular-nums text-slate-500">{day.count || ''}</span>
          <div className="flex h-24 w-full items-end">
            <div className="w-full rounded-t-sm bg-teal-600 transition-all" style={{ height: `${day.count ? Math.max(8, (day.count / max) * 100) : 3}%` }} />
          </div>
          <span className="text-xs text-slate-400">{new Date(`${day.key}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, detail, icon: Icon, tone }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 truncate text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>
    </div>
  )
}

export default function Reports() {
  const [dashboard, setDashboard] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [filters, setFilters] = useState({ report_type: 'summary', entity: 'overview', start_date: '', end_date: '', status: '', category: '', search: '', user_id: '' })
  const [report, setReport] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState('')
  const [historyLoading, setHistoryLoading] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [previewSearch, setPreviewSearch] = useState('')
  const [sort, setSort] = useState({ key: '', direction: 'asc' })
  const [page, setPage] = useState(0)
  const pageSize = 25

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true)
    try {
      const [dashboardResponse, historyResponse] = await Promise.all([API.get('/reports'), API.get('/reports/history')])
      setDashboard({ ...dashboardResponse.data, history: historyResponse.data })
      setError('')
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const overview = filters.entity === 'overview'
  const currentStatuses = statuses[filters.entity] || []

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function changeReportType(value) {
    setFilters((current) => ({
      ...current,
      report_type: value,
      entity: value !== 'summary' && current.entity === 'overview' ? 'invoices' : current.entity,
    }))
  }

  async function generate(event) {
    event.preventDefault()
    setGenerating(true)
    setError('')
    setNotice('')
    setPage(0)
    setPreviewSearch('')
    try {
      const response = await API.post('/reports/generate', {
        report_type: filters.report_type,
        entity: filters.entity,
        filters: {
          start_date: overview ? '' : filters.start_date,
          end_date: overview ? '' : filters.end_date,
          status: overview ? '' : filters.status,
          category: overview ? '' : filters.category,
          search: overview ? '' : filters.search,
          user_id: overview ? '' : filters.user_id,
        },
      })
      setReport(normalizedReport(response.data))
      setSort({ key: '', direction: 'asc' })
      setNotice('Report generated from current database records.')
      await loadDashboard()
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setGenerating(false)
    }
  }

  async function openHistory(id) {
    setHistoryLoading(id)
    setError('')
    try {
      const response = await API.get(`/reports/history/${id}`)
      setReport(normalizedReport(response.data))
      setPage(0)
      setPreviewSearch('')
      setSort({ key: '', direction: 'asc' })
      setNotice('Saved report preview loaded.')
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setHistoryLoading(null)
    }
  }

  async function exportReport(format, source = report) {
    if (!source) return
    setExporting(format)
    setError('')
    try {
      const exportSource = source === report
        ? { ...source, data: visibleRows, summary: { ...source.summary, record_count: visibleRows.length } }
        : source
      const { blob, filename } = createReportExport(exportSource, format)
      await API.put(`/reports/history/${source.id}/file`, blob, {
        params: { format, filename },
        headers: { 'Content-Type': 'application/octet-stream' },
      })
      saveBlob(blob, filename)
      setNotice(`${format.toUpperCase()} export saved to report history.`)
      await loadDashboard()
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setExporting('')
    }
  }

  async function downloadHistory(item) {
    setHistoryLoading(item.id)
    setError('')
    try {
      if (item.file_name) {
        const blob = await API.get(`/reports/history/${item.id}/download`, { responseType: 'blob' })
        saveBlob(blob, item.file_name)
      } else {
        const response = await API.get(`/reports/history/${item.id}`)
        const savedReport = normalizedReport(response.data)
        setReport(savedReport)
        await exportReport('xlsx', savedReport)
      }
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setHistoryLoading(null)
    }
  }

  const columns = useMemo(() => reportColumns(report?.data || []), [report])
  const visibleRows = useMemo(() => {
    if (!report) return []
    const search = previewSearch.trim().toLowerCase()
    const rows = report.data.filter((row) => !search || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(search)))
    if (!sort.key) return rows
    return [...rows].sort((left, right) => {
      const a = left[sort.key]
      const b = right[sort.key]
      const comparison = typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' })
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }, [report, previewSearch, sort])
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize))
  const pageRows = visibleRows.slice(page * pageSize, (page + 1) * pageSize)

  function sortBy(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
    setPage(0)
  }

  async function refresh() {
    setError('')
    await loadDashboard()
  }

  const stats = dashboard?.summary || {}
  const recentHistory = dashboard?.history || []
  const summaryCards = report?.entity === 'overview'
    ? [
      ['Records across modules', report.summary.record_count, 'Current database snapshot'],
      ['Invoice value', money(report.summary.invoice_value), 'All invoices'],
      ['Payments received', money(report.summary.payments_received), 'Completed payments'],
      ['Outstanding', money(report.summary.outstanding_balance), 'Confirmed invoices'],
    ]
    : [
      ['Matching records', report?.summary?.record_count ?? report?.data?.length ?? 0, 'Across all matching rows'],
      ...Object.entries(report?.summary?.totals || {}).slice(0, 3).map(([key, value]) => [columnLabel(key), money(value), `Filtered ${entities.find(([id]) => id === report.entity)?.[1]?.toLowerCase() || 'records'}`]),
    ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate database-backed reports and keep export history."
        action={<button type="button" className="button-secondary" onClick={refresh} disabled={dashboardLoading} title="Refresh report dashboard"><RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} /> Refresh</button>}
      />
      {error && <ErrorMessage message={error} />}
      {notice && <div role="status" className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">{notice}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report statistics">
        <Stat label="Total reports" value={stats.total_reports ?? '—'} detail="All saved report runs" icon={FileText} tone="bg-sky-50 text-sky-700" />
        <Stat label="Generated today" value={stats.reports_today ?? '—'} detail="Since midnight" icon={CalendarDays} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="This month" value={stats.monthly_reports ?? '—'} detail="Report runs this month" icon={BarChart3} tone="bg-amber-50 text-amber-700" />
        <Stat label="Most generated" value={stats.most_frequent?.report_name || 'No reports yet'} detail={stats.most_frequent ? `${stats.most_frequent.count} generations` : 'Generate a report to begin'} icon={Users} tone="bg-rose-50 text-rose-700" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div><h2 className="font-semibold text-slate-900">Generation activity</h2><p className="mt-1 text-sm text-slate-500">Reports generated over the last seven days</p></div>
            <BarChart3 className="h-5 w-5 text-teal-700" />
          </div>
          {dashboardLoading ? <div className="flex h-36 items-center justify-center text-sm text-slate-400">Loading activity…</div> : <ActivityChart activity={dashboard?.activity} />}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-900">Recent generations</h2><p className="mt-1 text-sm text-slate-500">Latest saved report snapshots</p></div><Clock3 className="h-5 w-5 text-slate-500" /></div>
          {recentHistory.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No reports generated yet.</p> : (
            <ul className="divide-y divide-slate-100">
              {recentHistory.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <button type="button" className="min-w-0 text-left" onClick={() => openHistory(item.id)}>
                    <span className="block truncate text-sm font-medium text-slate-800">{item.report_name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{dateOnly(item.created_at)} · {item.record_count} records</span>
                  </button>
                  <button type="button" className="table-action" aria-label={`Download ${item.report_name}`} title={item.file_name ? 'Download saved export' : 'Open and export saved report'} disabled={historyLoading === item.id} onClick={() => downloadHistory(item)}>
                    {historyLoading === item.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="report-builder" className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4"><h2 className="font-semibold text-slate-900">Generate a report</h2><p className="mt-1 text-sm text-slate-500">Choose a report period and the project records to include.</p></div>
        <form onSubmit={generate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="field-label">Report type
              <select className="field-control" value={filters.report_type} onChange={(event) => changeReportType(event.target.value)}>
                {reportTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field-label">Data source
              <select className="field-control" value={filters.entity} onChange={(event) => setFilters((current) => ({ ...current, entity: event.target.value, status: '', category: '', user_id: '' }))}>
                {entities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field-label">Start date
              <input className="field-control" type="date" value={filters.start_date} disabled={overview} max={filters.end_date || undefined} onChange={(event) => updateFilter('start_date', event.target.value)} />
            </label>
            <label className="field-label">End date
              <input className="field-control" type="date" value={filters.end_date} disabled={overview} min={filters.start_date || undefined} onChange={(event) => updateFilter('end_date', event.target.value)} />
            </label>
            <label className="field-label">Status
              <select className="field-control" value={filters.status} disabled={overview || currentStatuses.length === 0} onChange={(event) => updateFilter('status', event.target.value)}>
                <option value="">All statuses</option>
                {currentStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label className="field-label">Category / role
              <input className="field-control" value={filters.category} disabled={overview} onChange={(event) => updateFilter('category', event.target.value)} placeholder={filters.entity === 'products' ? 'Product category' : filters.entity === 'staff' ? 'Staff role' : 'Category contains…'} />
            </label>
            {(filters.entity === 'staff' || filters.entity === 'subscriptions') && <label className="field-label">{filters.entity === 'staff' ? 'User ID' : 'Customer ID'}
              <input className="field-control" type="number" min="1" value={filters.user_id} disabled={overview} onChange={(event) => updateFilter('user_id', event.target.value)} placeholder="Any" />
            </label>}
            <label className="field-label">Search ID or name
              <span className="relative block"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className="field-control pl-9" value={filters.search} disabled={overview} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search records" /></span>
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">Date basis: record creation, invoice issue date, or payment date.</p>
            <button className="button-primary" type="submit" disabled={generating}>
              {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {generating ? 'Generating…' : 'Generate report'}
            </button>
          </div>
        </form>
      </section>

      {report && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="preview-title">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-teal-700">Report preview</p>
              <h2 id="preview-title" className="mt-1 text-lg font-semibold text-slate-900">{report.report_name}</h2>
              <p className="mt-1 text-sm text-slate-500">Generated {new Date(report.generated_at || Date.now()).toLocaleString()} · {report.generated_by || 'Generator not recorded'}</p>
              <p className="mt-1 break-words text-xs text-slate-500">Applied filters: {Object.entries(report.filters || {}).filter(([, value]) => value !== null && value !== '').map(([key, value]) => `${columnLabel(key)}: ${value}`).join(' · ') || 'None'}</p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <button type="button" className="button-secondary" disabled={Boolean(exporting)} onClick={() => exportReport('csv')} title="Download CSV"><FileDown className="h-4 w-4" /> CSV</button>
              <button type="button" className="button-secondary" disabled={Boolean(exporting)} onClick={() => exportReport('xlsx')} title="Download Excel workbook"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
              <button type="button" className="button-secondary" disabled={Boolean(exporting)} onClick={() => exportReport('pdf')} title="Download PDF"><FileText className="h-4 w-4" /> PDF</button>
              <button type="button" className="button-secondary" onClick={() => window.print()} title="Print report"><Printer className="h-4 w-4" /> Print</button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(([label, value, detail]) => <div key={label} className="rounded-md bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-semibold text-slate-900">{value}</p><p className="mt-0.5 text-xs text-slate-500">{detail}</p></div>)}
          </div>

          {report.summary?.status_breakdown?.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-100 pb-4">
              {report.summary.status_breakdown.map((item) => <span key={item.status} className="text-sm text-slate-600"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-teal-600" />{item.status}: <strong className="text-slate-800">{item.count}</strong></span>)}
            </div>
          )}

          {report.truncated && <div role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Showing the first 5,000 matching rows. Summary totals include all matching records.</div>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <h3 className="font-semibold text-slate-800">Records <span className="ml-1 text-sm font-normal text-slate-500">{visibleRows.length.toLocaleString()} shown</span></h3>
            <label className="relative block w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="Filter preview rows" className="field-control pl-9" value={previewSearch} onChange={(event) => { setPreviewSearch(event.target.value); setPage(0) }} placeholder="Filter preview rows" /></label>
          </div>
          {columns.length === 0 || visibleRows.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 px-4 py-12 text-center"><p className="font-medium text-slate-700">No records match this report.</p><p className="mt-1 text-sm text-slate-500">Try changing the date range or filters.</p></div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>{columns.map((key) => <th key={key} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500"><button type="button" className="inline-flex items-center gap-1" onClick={() => sortBy(key)}>{columnLabel(key)}{sort.key === key && (sort.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</button></th>)}</tr></thead>
                <tbody>{pageRows.map((row, rowIndex) => <tr key={row.id ?? `${page}-${rowIndex}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">{columns.map((key) => <td key={key} className="max-w-64 break-words px-3 py-2 text-slate-700">{row[key] === null || row[key] === undefined ? '—' : row[key] instanceof Date ? row[key].toLocaleString() : String(row[key])}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          {visibleRows.length > pageSize && <div className="flex items-center justify-end gap-3 print:hidden"><span className="text-xs text-slate-500">Page {page + 1} of {pageCount}</span><button type="button" className="table-action" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(current - 1, 0))}><ChevronLeft className="h-4 w-4" /></button><button type="button" className="table-action" aria-label="Next page" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(current + 1, pageCount - 1))}><ChevronRight className="h-4 w-4" /></button></div>}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Report history</h2><p className="mt-1 text-sm text-slate-500">Saved report snapshots and exported files</p></div><span className="text-xs text-slate-500">Latest 50</span></div>
        {dashboardLoading ? <div className="flex justify-center py-8"><LoaderCircle className="h-5 w-5 animate-spin text-slate-400" /></div> : recentHistory.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">Generated reports will appear here.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500"><th className="py-2 pr-3">Report</th><th className="py-2 pr-3">Generated</th><th className="py-2 pr-3">Generated by</th><th className="py-2 pr-3">Rows</th><th className="py-2 pr-3">Export</th><th className="py-2 text-right">Actions</th></tr></thead>
              <tbody>{recentHistory.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-3 font-medium text-slate-800">{item.report_name}</td>
                  <td className="py-3 pr-3 text-slate-600">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">{item.generated_by || 'Not recorded'}</td>
                  <td className="py-3 pr-3 tabular-nums text-slate-600">{Number(item.record_count).toLocaleString()}</td>
                  <td className="py-3 pr-3 uppercase text-slate-600">{item.export_format}</td>
                  <td className="py-3 text-right"><div className="inline-flex items-center gap-1"><button type="button" className="table-action" title="Open saved preview" onClick={() => openHistory(item.id)} disabled={historyLoading === item.id}><FileText className="h-4 w-4" /></button><button type="button" className="table-action" title={item.file_name ? 'Download saved export' : 'Download saved report as Excel'} onClick={() => downloadHistory(item)} disabled={historyLoading === item.id}>{historyLoading === item.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
