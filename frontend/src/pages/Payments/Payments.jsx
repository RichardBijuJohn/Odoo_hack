import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, Eye, Plus, Search, X } from 'lucide-react'
import API from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0))
const readableError = (error) => error?.message || error?.response?.data?.message || (typeof error === 'string' ? error : 'Request failed. Please try again.')
const today = () => new Date().toISOString().slice(0, 10)
const methodLabels = { cash: 'Cash', card: 'Card', bank_transfer: 'Bank transfer', upi: 'UPI' }
const methodClass = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-slate-100 text-slate-700',
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button type="button" aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

function PaymentForm({ invoices, onClose, onSaved }) {
  const payableInvoices = invoices.filter((invoice) => invoice.status === 'confirmed' && Number(invoice.balance_due) > 0)
  const [form, setForm] = useState({ invoice_id: '', payment_date: today(), payment_method: 'upi', amount: '', transaction_ref: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedInvoice = payableInvoices.find((invoice) => String(invoice.id) === form.invoice_id)

  function chooseInvoice(id) {
    const invoice = payableInvoices.find((entry) => String(entry.id) === id)
    setForm((current) => ({ ...current, invoice_id: id, amount: invoice ? Number(invoice.balance_due).toFixed(2) : '' }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await API.post('/payments', {
        ...form,
        invoice_id: Number(form.invoice_id),
        amount: Number(form.amount),
      })
      onSaved('Payment recorded and invoice balance updated.')
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Record payment" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        {error && <ErrorMessage message={error} />}
        <label className="field-label">Invoice
          <select className="field-control" required value={form.invoice_id} onChange={(event) => chooseInvoice(event.target.value)}>
            <option value="">Select a confirmed invoice</option>
            {payableInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · {invoice.customer_name} · Due {money(invoice.balance_due)}</option>)}
          </select>
        </label>
        {selectedInvoice && (
          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div><p className="text-slate-500">Customer</p><p className="mt-1 font-semibold text-slate-800">{selectedInvoice.customer_name}</p><p className="text-slate-500">{selectedInvoice.customer_email}</p></div>
            <div><p className="text-slate-500">Outstanding balance</p><p className="mt-1 font-semibold text-amber-700">{money(selectedInvoice.balance_due)}</p></div>
          </div>
        )}
        {payableInvoices.length === 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">There are no confirmed invoices with an outstanding balance.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">Payment date
            <input className="field-control" type="date" required value={form.payment_date} onChange={(event) => setForm((current) => ({ ...current, payment_date: event.target.value }))} />
          </label>
          <label className="field-label">Payment method
            <select className="field-control" value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))}>
              {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field-label">Amount (₹)
            <input className="field-control" type="number" min="0.01" step="0.01" max={selectedInvoice?.balance_due} required value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
          </label>
          <label className="field-label">Payment reference
            <input className="field-control" maxLength={100} value={form.transaction_ref} onChange={(event) => setForm((current) => ({ ...current, transaction_ref: event.target.value }))} placeholder="Transaction ID (optional)" />
          </label>
          <label className="field-label sm:col-span-2">Note (optional)
            <textarea className="field-control min-h-20" maxLength={1000} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button-primary" disabled={saving || payableInvoices.length === 0}>{saving ? 'Recording…' : 'Record payment'}</button>
        </div>
      </form>
    </Modal>
  )
}

function PaymentDetails({ payment, onClose }) {
  const detail = [
    ['Payment ID', payment.payment_number],
    ['Invoice', payment.invoice_number],
    ['Customer', `${payment.customer_name}${payment.customer_email ? ` (${payment.customer_email})` : ''}`],
    ['Payment date', String(payment.payment_date).replace('T', ' ').slice(0, 16)],
    ['Method', methodLabels[payment.payment_method] || payment.payment_method],
    ['Amount', money(payment.amount)],
    ['Status', payment.status],
    ['Reference', payment.transaction_ref || '—'],
    ['Note', payment.note || '—'],
    ...(payment.total_amount !== undefined ? [['Remaining invoice balance', money(payment.balance_due)]] : []),
  ]
  return (
    <Modal title="Payment details" onClose={onClose}>
      <dl className="divide-y divide-slate-100">
        {detail.map(([label, value]) => <div key={label} className="grid grid-cols-3 gap-3 py-3 text-sm"><dt className="text-slate-500">{label}</dt><dd className="col-span-2 break-words font-medium text-slate-800">{value}</dd></div>)}
      </dl>
    </Modal>
  )
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState({})
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [modal, setModal] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [paymentResponse, invoiceResponse] = await Promise.all([API.get('/payments'), API.get('/invoices')])
      setPayments(paymentResponse.data)
      setSummary(paymentResponse.summary || {})
      setInvoices(invoiceResponse.data)
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => payments
    .filter((payment) => !method || payment.payment_method === method)
    .filter((payment) => !from || String(payment.payment_date).slice(0, 10) >= from)
    .filter((payment) => !to || String(payment.payment_date).slice(0, 10) <= to)
    .filter((payment) => !query || `${payment.payment_number} ${payment.invoice_number} ${payment.customer_name} ${payment.transaction_ref || ''} ${payment.note || ''}`.toLowerCase().includes(query.toLowerCase())), [payments, method, from, to, query])

  function saved(message) {
    setModal(null)
    setNotice(message)
    loadData()
  }

  const rows = filtered.map((payment) => [
    <span className="font-mono text-xs font-semibold text-slate-600">{payment.payment_number}</span>,
    <span className="font-mono text-xs">{payment.invoice_number}</span>,
    <span className="font-medium">{payment.customer_name}</span>,
    String(payment.payment_date).slice(0, 10),
    methodLabels[payment.payment_method] || payment.payment_method,
    <span className="font-semibold">{money(payment.amount)}</span>,
    <span className="block max-w-48 truncate" title={payment.note || payment.transaction_ref || ''}>{payment.note || payment.transaction_ref || '—'}</span>,
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${methodClass[payment.status] || methodClass.pending}`}>{payment.status}</span>,
    <button title="View payment" className="table-action" onClick={async () => {
      try {
        const response = await API.get(`/payments/${payment.id}`)
        setModal({ type: 'details', payment: response.data })
      } catch (requestError) { setError(readableError(requestError)) }
    }}><Eye className="h-4 w-4" /></button>,
  ])

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Record customer payments and track invoice balances."
        action={<button className="button-primary" onClick={() => setModal({ type: 'create' })}><Plus className="h-4 w-4" /> Record payment</button>}
      />
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      {notice && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total payments', summary.total_payments ?? 0, 'bg-blue-100', 'text-blue-600'],
          ['Amount received', money(summary.amount_received), 'bg-green-100', 'text-green-600'],
          ['Pending payments', summary.pending_payments ?? 0, 'bg-amber-100', 'text-amber-600'],
          ['Recent payments · 7 days', summary.recent_payments ?? 0, 'bg-indigo-100', 'text-indigo-600'],
        ].map(([label, value, background, color]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${background}`}><CreditCard className={`h-4 w-4 ${color}`} /></div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-semibold text-slate-800">Recent payments</h2>
            <label className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input aria-label="Search payments" className="field-control pl-9" placeholder="Search payment, invoice, customer" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select aria-label="Filter by payment method" className="field-control" value={method} onChange={(event) => setMethod(event.target.value)}>
              <option value="">All methods</option>
              {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label className="field-label-inline">From <input aria-label="Payment date from" className="field-control" type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
            <label className="field-label-inline">To <input aria-label="Payment date to" className="field-control" type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} /></label>
          </div>
        </div>
        {loading ? <LoadingSpinner text="Loading payments…" /> : (
          <DataTable columns={['Payment ID', 'Invoice', 'Customer', 'Payment date', 'Method', 'Amount', 'Note / reference', 'Status', 'Details']} rows={rows} emptyMsg="No payments match your filters." />
        )}
      </div>

      {modal?.type === 'details' && <PaymentDetails payment={modal.payment} onClose={() => setModal(null)} />}
      {modal?.type === 'create' && <PaymentForm invoices={invoices} onClose={() => setModal(null)} onSaved={saved} />}
    </div>
  )
}
