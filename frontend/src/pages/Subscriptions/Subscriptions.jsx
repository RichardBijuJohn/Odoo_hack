import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, Loader2, Plus, RefreshCw, Search, XCircle } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import {
  cancelSubscription,
  confirmSubscriptionPayment,
  createSubscription,
  getSubscriptionOptions,
  getSubscriptions,
  getSubscriptionSummary,
  renewSubscription,
} from '../../services/subscriptions'

const initialForm = {
  customer_id: '',
  plan_id: '',
  start_date: new Date().toISOString().slice(0, 10),
  duration: 1,
  quantity: 1,
  discount_amount: 0,
  notes: '',
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  active: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-50 text-red-700',
}

const formatDate = (value) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : '—'
const money = (value, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0))
const errorMessage = (error) => error?.message || error?.response?.data?.message || 'Something went wrong. Please try again.'

function SummaryCard({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-800">{value || 0}</p></div>
}

function Details({ subscription, onClose }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-800">Subscription details</h2><button type="button" onClick={onClose} aria-label="Close"><XCircle className="h-5 w-5 text-slate-400" /></button></div><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-slate-500">Subscription</p><p className="font-semibold">SUB-{String(subscription.id).padStart(4, '0')}</p></div><div><p className="text-slate-500">Status</p><p className="font-semibold capitalize">{subscription.status}</p></div><div><p className="text-slate-500">Customer</p><p className="font-semibold">{subscription.customer_name}</p><p className="text-xs text-slate-500">{subscription.customer_email}</p></div><div><p className="text-slate-500">Plan / product</p><p className="font-semibold">{subscription.plan_name}</p><p className="text-xs text-slate-500">{subscription.product_name || '—'}</p></div><div><p className="text-slate-500">Period</p><p className="font-semibold">{formatDate(subscription.start_date)} – {formatDate(subscription.end_date)}</p></div><div><p className="text-slate-500">Payment</p><p className="font-semibold capitalize">{subscription.payment_status}</p></div><div><p className="text-slate-500">Original amount</p><p className="font-semibold">{money(subscription.original_amount, subscription.plan_currency)}</p></div><div><p className="text-slate-500">Discount</p><p className="font-semibold">{money(subscription.discount_amount, subscription.plan_currency)}</p></div><div><p className="text-slate-500">Final amount</p><p className="font-semibold text-emerald-700">{money(subscription.final_amount, subscription.plan_currency)}</p></div><div><p className="text-slate-500">Invoice</p><p className="font-semibold">{subscription.invoice_number || 'Not generated'}</p></div></div><button type="button" onClick={onClose} className="button-secondary mt-6 w-full">Close</button></div></div>
}

function CreateForm({ options, form, setForm, onSubmit, onClose, saving, currentUser }) {
  const plan = options.plans.find((item) => String(item.id) === String(form.plan_id))
  const original = Number(plan?.price || 0) * Number(form.quantity || 1)
  const discount = Math.min(Math.max(Number(form.discount_amount) || 0, 0), original)
  const total = Math.max(original - discount, 0)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-800">Create subscription</h2><button type="button" onClick={onClose} aria-label="Close"><XCircle className="h-5 w-5 text-slate-400" /></button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {currentUser?.role !== 'customer' && <label className="text-sm font-medium text-slate-700">Customer<select required value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5"><option value="">Select customer</option>{options.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} ({customer.email})</option>)}</select></label>}
          <label className="text-sm font-medium text-slate-700">Published plan<select required value={form.plan_id} onChange={(event) => setForm({ ...form, plan_id: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5"><option value="">Select plan</option>{options.plans.map((item) => <option key={item.id} value={item.id}>{item.name} — {money(item.price, item.currency)}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Start date<input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" /></label>
          <label className="text-sm font-medium text-slate-700">Billing periods<input required min="1" max="120" type="number" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" /></label>
          <label className="text-sm font-medium text-slate-700">Quantity<input required min="1" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" /></label>
          <label className="text-sm font-medium text-slate-700">Discount amount<input min="0" max={original} type="number" step="0.01" value={form.discount_amount} onChange={(event) => setForm({ ...form, discount_amount: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" /></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Notes<textarea rows="2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" /></label>
        </div>
        {plan && <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold text-slate-800">{plan.name}</p><p className="text-slate-500">Billing cycle: {plan.billing_cycle} · Payment confirmation is required before activation.</p><div className="mt-3 grid grid-cols-3 gap-3"><span>Original<strong className="block text-slate-800">{money(original, plan.currency)}</strong></span><span>Discount<strong className="block text-red-600">-{money(discount, plan.currency)}</strong></span><span>Total<strong className="block text-emerald-700">{money(total, plan.currency)}</strong></span></div></div>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button disabled={saving} className="button-primary">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Create pending subscription</button></div>
      </form>
    </div>
  )
}

export default function Subscriptions() {
  const { currentUser, isAdmin, isStaff } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [summary, setSummary] = useState({})
  const [options, setOptions] = useState({ plans: [], customers: [] })
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState(initialForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [list, totals, available] = await Promise.all([getSubscriptions(filters), getSubscriptionSummary(), getSubscriptionOptions()])
      setSubscriptions(list.data || [])
      setSummary(totals.data || {})
      setOptions(available.data || { plans: [], customers: [] })
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { refresh() }, [refresh])

  const visibleSubscriptions = useMemo(() => subscriptions, [subscriptions])
  const openCreate = () => {
    setForm({ ...initialForm, customer_id: currentUser?.role === 'customer' ? String(currentUser.id) : '' })
    setModalOpen(true)
  }
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await createSubscription(form)
      setFeedback(response.message || 'Subscription created and awaiting payment confirmation.')
      setModalOpen(false)
      await refresh()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }
  const action = async (operation, successMessage) => {
    try { await operation(); setFeedback(successMessage); await refresh() } catch (requestError) { setError(errorMessage(requestError)) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Create, monitor, renew, and cancel customer subscriptions." action={<button type="button" onClick={openCreate} className="button-primary"><Plus className="h-4 w-4" /> New subscription</button>} />
      {feedback && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</div>}
      {error && <ErrorMessage message={error} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><SummaryCard label="Total" value={summary.total} /><SummaryCard label="Active" value={summary.active} /><SummaryCard label="Pending" value={summary.pending} /><SummaryCard label="Expired" value={summary.expired} /><SummaryCard label="Cancelled" value={summary.cancelled} /></div>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search customer or subscription ID" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" /></div><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="rounded-lg border border-slate-200 p-2 text-sm"><option value="">All statuses</option>{['pending', 'active', 'expired', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}</select><button type="button" onClick={refresh} className="button-secondary" aria-label="Refresh subscriptions"><RefreshCw className="h-4 w-4" /></button></div>
        {loading ? <LoadingSpinner text="Loading subscriptions..." /> : visibleSubscriptions.length === 0 ? <EmptyState title="No subscriptions found" description="Create a subscription for a published plan to get started." /> : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500"><tr>{['Subscription', 'Customer', 'Plan', 'Period', 'Amount', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead><tbody>{visibleSubscriptions.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="px-3 py-3 font-mono text-xs">SUB-{String(item.id).padStart(4, '0')}</td><td className="px-3 py-3"><strong>{item.customer_name}</strong><span className="block text-xs text-slate-500">{item.customer_email}</span></td><td className="px-3 py-3">{item.plan_name}</td><td className="px-3 py-3">{formatDate(item.start_date)} – {formatDate(item.end_date)}<span className="block text-xs text-slate-500 capitalize">{item.billing_cycle}</span></td><td className="px-3 py-3 font-semibold">{money(item.final_amount, item.plan_currency)}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[item.status] || statusStyles.expired}`}>{item.status}</span></td><td className="px-3 py-3"><div className="flex gap-1"><button title="View details" className="table-action" onClick={() => setSelected(item)}><Eye className="h-4 w-4" /></button>{item.status === 'pending' && (isAdmin || isStaff) && <button title="Confirm payment" className="table-action text-emerald-600" onClick={() => action(() => confirmSubscriptionPayment(item.id), 'Payment confirmed and subscription activated.')}><CheckCircle2 className="h-4 w-4" /></button>}{['pending', 'active'].includes(item.status) && <button title="Cancel subscription" className="table-action text-red-600" onClick={() => action(() => cancelSubscription(item.id, window.prompt('Optional cancellation reason') || ''), 'Subscription cancelled.')}><XCircle className="h-4 w-4" /></button>}{item.status !== 'cancelled' && <button title="Renew subscription" className="table-action" onClick={() => action(() => renewSubscription(item.id), 'Renewal created and awaiting payment confirmation.')}><RefreshCw className="h-4 w-4" /></button>}</div></td></tr>)}</tbody></table></div>}
      </section>
      {modalOpen && <CreateForm options={options} form={form} setForm={setForm} onSubmit={submit} onClose={() => setModalOpen(false)} saving={saving} currentUser={currentUser} />}
      {selected && <Details subscription={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
