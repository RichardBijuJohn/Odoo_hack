import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Eye, FileText, Pencil, Plus, Search, X } from 'lucide-react'
import API from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'

const today = () => new Date().toISOString().slice(0, 10)
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0))
const readableError = (error) => error?.message || error?.response?.data?.message || (typeof error === 'string' ? error : 'Request failed. Please try again.')
const statusClass = {
  draft: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const blankItem = () => ({ description: '', quantity: '1', unit_price: '', tax_percentage: '0' })
const blankForm = () => ({
  customer_id: '',
  subscription_id: '',
  issue_date: today(),
  due_date: today(),
  discount_code: '',
  items: [blankItem()],
})

function calculateTotals(items) {
  return items.reduce((totals, item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unit_price) || 0
    const taxRate = Number(item.tax_percentage) || 0
    const subtotal = Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100
    const tax = Math.round((subtotal * taxRate / 100 + Number.EPSILON) * 100) / 100
    totals.subtotal += subtotal
    totals.tax += tax
    return totals
  }, { subtotal: 0, tax: 0 })
}

function InvoiceForm({ customers, subscriptions, invoice, onClose, onSaved }) {
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const totals = useMemo(() => calculateTotals(form.items), [form.items])
  const customerSubscriptions = subscriptions.filter((subscription) => String(subscription.customer_id) === String(form.customer_id))

  useEffect(() => {
    if (!invoice) return
    setForm({
      customer_id: String(invoice.customer_id),
      subscription_id: invoice.subscription_id ? String(invoice.subscription_id) : '',
      issue_date: String(invoice.issue_date).slice(0, 10),
      due_date: String(invoice.due_date).slice(0, 10),
      discount_code: '',
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
        tax_percentage: String(item.tax_percentage),
      })),
    })
  }, [invoice])

  function updateItem(index, field, value) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      customer_id: Number(form.customer_id),
      subscription_id: form.subscription_id ? Number(form.subscription_id) : null,
      items: form.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        tax_percentage: Number(item.tax_percentage),
      })),
    }
    try {
      if (invoice) await API.put(`/invoices/${invoice.id}`, payload)
      else await API.post('/invoices', payload)
      onSaved(invoice ? 'Draft invoice updated.' : 'Invoice created as a draft.')
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={invoice ? 'Edit draft invoice' : 'Create invoice'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorMessage message={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">Customer
            <select className="field-control" required value={form.customer_id} onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value, subscription_id: '' }))}>
              <option value="">Select a customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} ({customer.email})</option>)}
            </select>
          </label>
          <label className="field-label">Subscription (optional)
            <select className="field-control" value={form.subscription_id} disabled={!form.customer_id} onChange={(event) => setForm((current) => ({ ...current, subscription_id: event.target.value }))}>
              <option value="">No subscription</option>
              {customerSubscriptions.map((subscription) => <option key={subscription.id} value={subscription.id}>SUB-{subscription.id} · {subscription.plan_name}</option>)}
            </select>
          </label>
          <label className="field-label">Invoice date
            <input className="field-control" type="date" required value={form.issue_date} onChange={(event) => setForm((current) => ({ ...current, issue_date: event.target.value }))} />
          </label>
          <label className="field-label">Due date
            <input className="field-control" type="date" required min={form.issue_date} value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} />
          </label>
          <label className="field-label">Discount code (optional)
            <input className="field-control" placeholder="e.g. SUMMER20" value={form.discount_code} onChange={(event) => setForm((current) => ({ ...current, discount_code: event.target.value.toUpperCase() }))} />
          </label>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Invoice items</h3>
            <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={() => setForm((current) => ({ ...current, items: [...current.items, blankItem()] }))}>+ Add item</button>
          </div>
          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="field-label sm:col-span-2">Product or subscription description
                    <input className="field-control" required maxLength={500} value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} />
                  </label>
                  <label className="field-label">Quantity
                    <input className="field-control" type="number" min="0.001" step="0.001" required value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} />
                  </label>
                  <label className="field-label">Unit price (₹)
                    <input className="field-control" type="number" min="0" step="0.01" required value={item.unit_price} onChange={(event) => updateItem(index, 'unit_price', event.target.value)} />
                  </label>
                  <label className="field-label">Tax percentage
                    <input className="field-control" type="number" min="0" max="100" step="0.01" required value={item.tax_percentage} onChange={(event) => updateItem(index, 'tax_percentage', event.target.value)} />
                  </label>
                  <div className="flex items-end justify-between">
                    <p className="pb-2 text-sm text-slate-500">Line total: <span className="font-semibold text-slate-700">{money((Number(item.quantity) || 0) * (Number(item.unit_price) || 0) * (1 + (Number(item.tax_percentage) || 0) / 100))}</span></p>
                    {form.items.length > 1 && <button type="button" className="pb-2 text-sm text-red-600 hover:text-red-700" onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-500">Subtotal</span><span>{money(totals.subtotal)}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Tax</span><span>{money(totals.tax)}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Discount</span><span className="text-emerald-700">Applied on save</span></div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-800"><span>Total</span><span>{money(totals.subtotal + totals.tax)}</span></div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button-primary" disabled={saving || customers.length === 0}>{saving ? 'Saving…' : invoice ? 'Save changes' : 'Create draft'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button type="button" aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

function InvoiceDetails({ invoice, onClose }) {
  return (
    <Modal title={`Invoice ${invoice.invoice_number}`} onClose={onClose}>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div><p className="text-slate-500">Customer</p><p className="mt-1 font-semibold">{invoice.customer_name}</p><p className="text-slate-500">{invoice.customer_email}</p></div>
        <div><p className="text-slate-500">Status</p><p className="mt-1 capitalize font-semibold">{invoice.status}</p><p className="text-slate-500">Subscription: {invoice.subscription_id ? `SUB-${invoice.subscription_id}` : '—'}</p></div>
        <div><p className="text-slate-500">Invoice date</p><p className="mt-1">{String(invoice.issue_date).slice(0, 10)}</p></div>
        <div><p className="text-slate-500">Due date</p><p className="mt-1">{String(invoice.due_date).slice(0, 10)}</p></div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Description</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit price</th><th className="px-3 py-2">Tax</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
          <tbody>{invoice.items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-3 py-2">{item.description}</td><td className="px-3 py-2">{item.quantity}</td><td className="px-3 py-2">{money(item.unit_price)}</td><td className="px-3 py-2">{item.tax_percentage}%</td><td className="px-3 py-2 text-right">{money(item.total_amount)}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(invoice.amount)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{money(invoice.tax_amount)}</span></div>
        <div className="flex justify-between py-1"><span>Discount{invoice.discount_name ? ` (${invoice.discount_name})` : ''}</span><span className="text-emerald-700">-{money(invoice.discount_amount)}</span></div>
        <div className="flex justify-between font-bold"><span>Total</span><span>{money(invoice.total_amount)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Paid</span><span>{money(invoice.paid_amount)}</span></div>
        <div className="flex justify-between font-semibold text-amber-700"><span>Outstanding</span><span>{money(invoice.balance_due ?? Number(invoice.total_amount) - Number(invoice.paid_amount))}</span></div>
      </div>
    </Modal>
  )
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [summary, setSummary] = useState({})
  const [customers, setCustomers] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortDirection, setSortDirection] = useState('desc')
  const [modal, setModal] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [invoiceResponse, optionsResponse] = await Promise.all([API.get('/invoices'), API.get('/invoices/options')])
      setInvoices(invoiceResponse.data)
      setSummary(invoiceResponse.summary || {})
      setCustomers(optionsResponse.data.customers)
      setSubscriptions(optionsResponse.data.subscriptions)
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInvoices() }, [loadInvoices])

  const filtered = useMemo(() => invoices
    .filter((invoice) => !statusFilter || invoice.status === statusFilter)
    .filter((invoice) => !query || `${invoice.invoice_number} ${invoice.customer_name}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sortDirection === 'asc'
      ? String(a.issue_date).localeCompare(String(b.issue_date))
      : String(b.issue_date).localeCompare(String(a.issue_date))), [invoices, query, sortDirection, statusFilter])

  async function runAction(invoice, action) {
    setBusyId(invoice.id)
    setError('')
    setNotice('')
    try {
      await API.patch(`/invoices/${invoice.id}/${action}`)
      setNotice(action === 'confirm' ? 'Invoice confirmed.' : 'Invoice cancelled.')
      await loadInvoices()
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setBusyId(null)
    }
  }

  function saved(message) {
    setModal(null)
    setNotice(message)
    loadInvoices()
  }

  const rows = filtered.map((invoice) => [
    <span className="font-mono text-xs font-semibold text-slate-600">{invoice.invoice_number}</span>,
    <span className="font-medium">{invoice.customer_name}</span>,
    String(invoice.issue_date).slice(0, 10),
    String(invoice.due_date).slice(0, 10),
    <span className="font-semibold">{money(invoice.total_amount)}</span>,
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[invoice.status]}`}>{invoice.status}</span>,
    <div className="flex flex-wrap items-center gap-1">
      <button title="View invoice" className="table-action" onClick={async () => {
        try {
          const response = await API.get(`/invoices/${invoice.id}`)
          setModal({ type: 'details', invoice: response.data })
        } catch (requestError) { setError(readableError(requestError)) }
      }}><Eye className="h-4 w-4" /></button>
      {invoice.status === 'draft' && <button title="Edit draft" className="table-action" onClick={async () => {
        try {
          const response = await API.get(`/invoices/${invoice.id}`)
          setModal({ type: 'edit', invoice: response.data })
        } catch (requestError) { setError(readableError(requestError)) }
      }}><Pencil className="h-4 w-4" /></button>}
      {invoice.status === 'draft' && <button title="Confirm" disabled={busyId === invoice.id} className="table-action text-green-600" onClick={() => runAction(invoice, 'confirm')}><Check className="h-4 w-4" /></button>}
      {['draft', 'confirmed'].includes(invoice.status) && <button title="Cancel invoice" disabled={busyId === invoice.id} className="table-action text-red-600" onClick={() => runAction(invoice, 'cancel')}><X className="h-4 w-4" /></button>}
    </div>,
  ])

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Create, track, and manage customer invoices."
        action={<button className="button-primary" onClick={() => setModal({ type: 'create' })}><Plus className="h-4 w-4" /> Create invoice</button>}
      />
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      {notice && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total invoices', summary.total_invoices ?? 0, 'text-blue-600', 'bg-blue-100'],
          ['Draft invoices', summary.draft_invoices ?? 0, 'text-slate-600', 'bg-slate-100'],
          ['Confirmed invoices', summary.confirmed_invoices ?? 0, 'text-indigo-600', 'bg-indigo-100'],
          ['Paid invoices', summary.paid_invoices ?? 0, 'text-green-600', 'bg-green-100'],
          ['Outstanding amount', money(summary.outstanding_amount), 'text-amber-600', 'bg-amber-100'],
        ].map(([label, value, color, background]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${background}`}><FileText className={`h-4 w-4 ${color}`} /></div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold text-slate-800">All invoices</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input aria-label="Search invoices" className="field-control pl-9" placeholder="Search invoice or customer" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <select aria-label="Filter by status" className="field-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              {['draft', 'confirmed', 'paid', 'cancelled'].map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
            </select>
            <button className="button-secondary whitespace-nowrap" onClick={() => setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')}>Date {sortDirection === 'asc' ? '↑' : '↓'}</button>
          </div>
        </div>
        {loading ? <LoadingSpinner text="Loading invoices…" /> : (
          <DataTable columns={['Invoice number', 'Customer', 'Invoice date', 'Due date', 'Amount', 'Status', 'Actions']} rows={rows} emptyMsg="No invoices match your filters." />
        )}
      </div>

      {modal?.type === 'details' && <InvoiceDetails invoice={modal.invoice} onClose={() => setModal(null)} />}
      {(modal?.type === 'create' || modal?.type === 'edit') && <InvoiceForm customers={customers} subscriptions={subscriptions} invoice={modal.invoice} onClose={() => setModal(null)} onSaved={saved} />}
    </div>
  )
}
