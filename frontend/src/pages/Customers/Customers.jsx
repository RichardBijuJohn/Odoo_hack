import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Building2, CheckCircle2, Copy, Download, Mail, MapPin, Phone,
  Plus, Search, SlidersHorizontal, UserRound, X
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import CustomerModal from './CustomerModal'
import { getCustomers } from '../../services/customers'

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-600',
  lead: 'bg-blue-100 text-blue-700',
  trial: 'bg-yellow-100 text-yellow-700',
}

const getStatusColor = (status) => statusColors[(status || '').toLowerCase()] || 'bg-slate-100 text-slate-600'
const formatStatus = (status) => status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown'
const customerId = (id) => typeof id === 'number' ? `CUS-${String(id).padStart(3, '0')}` : id
const formatDate = (date) => date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(date)) : 'Not available'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [copied, setCopied] = useState(false)

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getCustomers()
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      setCustomers(list)
    } catch (err) {
      setError(err?.message || (typeof err === 'string' ? err : 'Failed to load customers.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customers
      .filter((customer) => {
        const matchesStatus = statusFilter === 'all' || (customer.status || '').toLowerCase() === statusFilter
        const matchesQuery = !query || [customer.name, customer.email, customer.phone, customer.company_name]
          .some((value) => String(value || '').toLowerCase().includes(query))
        return matchesStatus && matchesQuery
      })
      .sort((a, b) => {
        if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''))
        if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      })
  }, [customers, search, statusFilter, sortBy])

  const summary = useMemo(() => ({
    total: customers.length,
    active: customers.filter((customer) => customer.status === 'active').length,
    leads: customers.filter((customer) => customer.status === 'lead').length,
    missingPhone: customers.filter((customer) => !customer.phone).length,
  }), [customers])

  function exportCustomers() {
    const header = ['Customer ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Created']
    const rows = filteredCustomers.map((customer) => [
      customerId(customer.id), customer.name, customer.email, customer.phone || '',
      customer.company_name || '', formatStatus(customer.status), customer.created_at || '',
    ])
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'brightloop-customers.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function copyEmail(email) {
    if (!email || !navigator.clipboard) return
    await navigator.clipboard.writeText(email)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer accounts, contact details, and account readiness."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportCustomers} disabled={!filteredCustomers.length} className="button-secondary">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button type="button" onClick={() => setIsModalOpen(true)} className="button-primary">
              <Plus className="h-4 w-4" /> Add Customer
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={UserRound} label="Total customers" value={summary.total} detail="All customer records" tone="blue" />
        <SummaryCard icon={CheckCircle2} label="Active accounts" value={summary.active} detail="Ready for billing" tone="green" />
        <SummaryCard icon={Building2} label="New leads" value={summary.leads} detail="Potential customers" tone="purple" />
        <SummaryCard icon={Phone} label="Missing phone" value={summary.missingPhone} detail="Profiles to complete" tone="amber" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone, or company..."
              className="field-control pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-control w-auto py-2">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="field-control w-auto py-2">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
        {(search || statusFilter !== 'all') && (
          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredCustomers.length} of {customers.length} customers
            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all') }} className="ml-2 font-semibold text-blue-600 hover:underline">Clear filters</button>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        {loading ? <LoadingSpinner text="Loading customers..." /> : error ? <ErrorMessage message={error} /> : customers.length === 0 ? (
          <EmptyState title="No customers yet" description="There are currently no customer accounts in the system." action={<button type="button" onClick={() => setIsModalOpen(true)} className="button-primary"><Plus className="h-4 w-4" /> Add Customer</button>} />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState title="No matching customers" description="Try a different search term or clear the current filters." />
        ) : (
          <DataTable
            columns={['Customer ID', 'Name', 'Email', 'Phone', 'Company', 'Status', '']}
            rows={filteredCustomers.map((customer) => [
              <span key={`id-${customer.id}`} className="font-mono text-xs text-slate-500">{customerId(customer.id)}</span>,
              <button type="button" key={`name-${customer.id}`} onClick={() => setSelectedCustomer(customer)} className="text-left font-semibold text-slate-800 hover:text-blue-600">{customer.name}</button>,
              customer.email,
              customer.phone || <span className="text-slate-400">Not provided</span>,
              customer.company_name || <span className="text-slate-400">Individual</span>,
              <span key={`status-${customer.id}`} className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(customer.status)}`}>{formatStatus(customer.status)}</span>,
              <button type="button" key={`view-${customer.id}`} onClick={() => setSelectedCustomer(customer)} className="text-xs font-semibold text-blue-600 hover:underline">View</button>,
            ])}
          />
        )}
      </div>

      <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchCustomers} />
      {selectedCustomer && (
        <CustomerDetails customer={selectedCustomer} copied={copied} onCopyEmail={copyEmail} onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, detail, tone }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`rounded-lg p-2 ${styles[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  )
}

function CustomerDetails({ customer, copied, onCopyEmail, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer profile</p>
            <h2 className="mt-1 text-xl font-bold text-slate-800">{customer.name}</h2>
            <p className="mt-1 font-mono text-xs text-slate-400">{customerId(customer.id)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close customer details"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">{customer.name?.charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{customer.company_name || 'Individual customer'}</p>
            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(customer.status)}`}>{formatStatus(customer.status)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Detail icon={Mail} label="Email" value={customer.email} action={<button type="button" onClick={() => onCopyEmail(customer.email)} className="text-xs font-semibold text-blue-600 hover:underline">{copied ? 'Copied' : <Copy className="h-4 w-4" />}</button>} />
          <Detail icon={Phone} label="Phone" value={customer.phone || 'Not provided'} />
          <Detail icon={MapPin} label="Address" value={customer.address || 'Not provided'} />
          <Detail icon={Building2} label="Company" value={customer.company_name || 'Individual customer'} />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Account timeline</p>
          <div className="mt-3 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Customer added</p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(customer.created_at)}</p>
          </div>
          <a href={`mailto:${customer.email}`} className="button-primary mt-4 w-full"><Mail className="h-4 w-4" /> Contact customer</a>
        </div>
      </aside>
    </div>
  )
}

function Detail({ icon: Icon, label, value, action }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm text-slate-700">{value}</p>
      </div>
      {action}
    </div>
  )
}
