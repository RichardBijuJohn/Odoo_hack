import { useEffect, useMemo, useState } from 'react'
import { Check, Edit3, Eye, Filter, Percent, Plus, Search, Trash2, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import { useCatalog } from '../../context/CatalogContext'
import { createDiscount, updateDiscount, activateDiscount, deactivateDiscount, deleteDiscount, getDiscounts } from '../../services/discounts'

const today = () => new Date().toISOString().slice(0, 10)
const blank = () => ({ name: '', code: '', description: '', discount_type: 'percentage', discount_value: '', minimum_purchase_amount: '0', minimum_quantity: '0', start_date: today(), end_date: today(), usage_limit: '', product_ids: [], plan_ids: [], apply_to: 'subscription', status: 'active' })
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const badge = { active: 'bg-emerald-100 text-emerald-700', scheduled: 'bg-blue-100 text-blue-700', expired: 'bg-rose-100 text-rose-700', inactive: 'bg-slate-100 text-slate-600' }

export default function Discounts() {
  const { products, plans } = useCatalog()
  const [discounts, setDiscounts] = useState([])
  const [form, setForm] = useState(blank())
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    try {
      setLoading(true)
      const response = await getDiscounts()
      setDiscounts(response.data || [])
    } catch (requestError) { setError(requestError?.message || 'Unable to load discounts.') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => discounts.filter((discount) => {
    const matchesText = !query || `${discount.name} ${discount.code}`.toLowerCase().includes(query.toLowerCase())
    return matchesText && (status === 'all' || discount.lifecycle_status === status)
  }), [discounts, query, status])
  const summary = useMemo(() => ({
    total: discounts.length,
    active: discounts.filter((item) => item.lifecycle_status === 'active').length,
    scheduled: discounts.filter((item) => item.lifecycle_status === 'scheduled').length,
    expired: discounts.filter((item) => item.lifecycle_status === 'expired').length,
  }), [discounts])

  function openCreate() { setEditing(null); setForm(blank()); setError(''); setShowForm(true) }
  function openEdit(discount) {
    setEditing(discount)
    setForm({ ...blank(), ...discount, product_ids: discount.product_ids || [], plan_ids: discount.plan_ids || [], usage_limit: discount.usage_limit ?? '' })
    setError(''); setShowForm(true)
  }
  function change(field, value) { setForm((current) => ({ ...current, [field]: value })) }
  function toggle(field, id) { setForm((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((value) => value !== id) : [...current[field], id] })) }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) return setError('Percentage discounts cannot exceed 100%.')
    if (form.end_date < form.start_date) return setError('End date must be after the start date.')
    if (Number(form.discount_value) <= 0) return setError('Discount value must be greater than zero.')
    try {
      setSaving(true)
      if (editing) await updateDiscount(editing.id, form)
      else await createDiscount(form)
      setShowForm(false); setNotice(editing ? 'Discount updated successfully.' : 'Discount created successfully.'); await load()
    } catch (requestError) { setError(requestError?.message || 'Unable to save discount.') } finally { setSaving(false) }
  }

  async function action(callback, message) {
    try { await callback(); setNotice(message); await load() } catch (requestError) { setError(requestError?.message || 'Discount action failed.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Discount Management" description="Create and control promotional rules for subscriptions and products." action={<button type="button" onClick={openCreate} className="button-primary"><Plus className="h-4 w-4" /> Create Discount</button>} />
      {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><Check className="h-4 w-4" />{notice}<button type="button" className="ml-auto" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}
      {error && !showForm && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary title="Total discount rules" value={summary.total} icon={Percent} />
        <Summary title="Active discounts" value={summary.active} icon={Check} tone="green" />
        <Summary title="Scheduled discounts" value={summary.scheduled} icon={Filter} tone="blue" />
        <Summary title="Expired discounts" value={summary.expired} icon={X} tone="rose" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search discount name or code..." className="field-control pl-9" /></div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="field-control w-auto"><option value="all">All statuses</option><option value="active">Active</option><option value="scheduled">Scheduled</option><option value="expired">Expired</option><option value="inactive">Inactive</option></select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <LoadingSpinner text="Loading discounts..." /> : filtered.length === 0 ? <EmptyState title="No discounts found" description="Create a discount rule or adjust your filters." action={<button type="button" onClick={openCreate} className="button-primary"><Plus className="h-4 w-4" /> Create Discount</button>} /> : (
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50"><tr>{['Discount', 'Code', 'Type / Value', 'Minimums', 'Validity', 'Usage', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((discount) => <tr key={discount.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><p className="font-semibold text-slate-800">{discount.name}</p><p className="max-w-[180px] truncate text-xs text-slate-400">{discount.description || 'No description'}</p></td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-blue-700">{discount.code}</td>
                <td className="px-4 py-3">{discount.discount_type === 'percentage' ? `${discount.discount_value}%` : money(discount.discount_value)}<p className="text-xs text-slate-400">{discount.discount_type === 'percentage' ? 'Percentage' : 'Fixed amount'}</p></td>
                <td className="px-4 py-3 text-xs text-slate-600">{money(discount.minimum_purchase_amount)}<br />Qty: {discount.minimum_quantity}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{String(discount.start_date).slice(0, 10)}<br />to {String(discount.end_date).slice(0, 10)}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{discount.used_count}{discount.usage_limit ? ` / ${discount.usage_limit}` : ' / unlimited'}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${badge[discount.lifecycle_status]}`}>{discount.lifecycle_status}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-1"><button type="button" title="View" onClick={() => setSelected(discount)} className="table-action"><Eye className="h-4 w-4" /></button><button type="button" title="Edit" onClick={() => openEdit(discount)} className="table-action"><Edit3 className="h-4 w-4" /></button>{discount.status === 'active' ? <button type="button" title="Deactivate" onClick={() => action(() => deactivateDiscount(discount.id), 'Discount deactivated.')} className="table-action"><X className="h-4 w-4" /></button> : <button type="button" title="Activate" onClick={() => action(() => activateDiscount(discount.id), 'Discount activated.')} className="table-action"><Check className="h-4 w-4" /></button>}<button type="button" title="Delete" onClick={() => window.confirm(`Delete ${discount.name}?`) && action(() => deleteDiscount(discount.id), 'Discount deleted.')} className="table-action text-rose-500"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>)}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <DiscountForm form={form} editing={editing} products={products} plans={plans} saving={saving} error={error} change={change} toggle={toggle} onSubmit={submit} onClose={() => setShowForm(false)} />}
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setSelected(null)}><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex justify-between"><div><p className="text-xs uppercase tracking-wider text-slate-400">Discount rule</p><h2 className="text-xl font-bold text-slate-800">{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)}><X className="h-5 w-5 text-slate-400" /></button></div><div className="mt-5 grid grid-cols-2 gap-4 text-sm"><Info label="Code" value={selected.code} /><Info label="Value" value={selected.discount_type === 'percentage' ? `${selected.discount_value}%` : money(selected.discount_value)} /><Info label="Applies to" value={selected.apply_to} /><Info label="Used" value={`${selected.used_count}${selected.usage_limit ? ` / ${selected.usage_limit}` : ''}`} /><Info label="Starts" value={String(selected.start_date).slice(0, 10)} /><Info label="Ends" value={String(selected.end_date).slice(0, 10)} /></div></div></div>}
    </div>
  )
}

function Summary({ title, value, icon: Icon, tone = 'blue' }) { const colors = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600' }; return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p><span className={`rounded-lg p-2 ${colors[tone]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-2xl font-extrabold text-slate-800">{value}</p></div> }
function Info({ label, value }) { return <div><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div> }

function DiscountForm({ form, editing, products, plans, saving, error, change, toggle, onSubmit, onClose }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"><form onSubmit={onSubmit} className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit discount' : 'Create discount'}</h2><p className="text-xs text-slate-500">Only administrators can manage discount rules.</p></div><button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button></div><div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">{error && <ErrorMessage message={error} />}<div className="grid gap-4 sm:grid-cols-2"><Field label="Discount name" value={form.name} onChange={(value) => change('name', value)} required /><Field label="Discount code" value={form.code} onChange={(value) => change('code', value.toUpperCase())} required /><Field label="Description" value={form.description} onChange={(value) => change('description', value)} /><label className="field-label">Discount type<select className="field-control" value={form.discount_type} onChange={(event) => change('discount_type', event.target.value)}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><Field label={`Discount value ${form.discount_type === 'percentage' ? '(%)' : '(₹)'}`} type="number" value={form.discount_value} onChange={(value) => change('discount_value', value)} required /><Field label="Minimum purchase amount (₹)" type="number" value={form.minimum_purchase_amount} onChange={(value) => change('minimum_purchase_amount', value)} /><Field label="Minimum quantity" type="number" value={form.minimum_quantity} onChange={(value) => change('minimum_quantity', value)} /><Field label="Maximum usage count" type="number" value={form.usage_limit} onChange={(value) => change('usage_limit', value)} /><Field label="Start date" type="date" value={form.start_date} onChange={(value) => change('start_date', value)} required /><Field label="End date" type="date" value={form.end_date} onChange={(value) => change('end_date', value)} required /><label className="field-label">Apply to<select className="field-control" value={form.apply_to} onChange={(event) => change('apply_to', event.target.value)}><option value="subscription">Entire subscription</option><option value="product">Product</option></select></label><label className="field-label">Status<select className="field-control" value={form.status} onChange={(event) => change('status', event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div><CheckList label="Applicable products" items={products} selected={form.product_ids} onToggle={(id) => toggle('product_ids', id)} /><CheckList label="Applicable subscription plans" items={plans} selected={form.plan_ids} onToggle={(id) => toggle('plan_ids', id)} /></div><div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" disabled={saving} className="button-primary">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create discount'}</button></div></form></div>
}
function Field({ label, value, onChange, type = 'text', required }) { return <label className="field-label">{label}<input className="field-control" type={type} required={required} min={type === 'number' ? '0' : undefined} value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></label> }
function CheckList({ label, items, selected, onToggle }) { return <div><p className="field-label mb-2">{label}</p><div className="grid max-h-32 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">{items.length ? items.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />{item.name}</label>) : <span className="text-xs text-slate-400">No options available</span>}</div></div> }
