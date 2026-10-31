import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import CustomerModal from './CustomerModal'
import { getCustomers } from '../../services/customers'

const statusColors = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-600',
  lead:     'bg-blue-100 text-blue-700',
  trial:    'bg-yellow-100 text-yellow-700',
}

const getStatusColor = (status) => {
  const key = (status || '').toLowerCase()
  return statusColors[key] || 'bg-slate-100 text-slate-600'
}

const formatStatus = (status) => {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleCustomerCreated = () => {
    fetchCustomers()
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer accounts and their subscriptions."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {loading ? (
          <LoadingSpinner text="Loading customers..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="There are currently no customer accounts in the system."
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Plus className="w-4 h-4" /> Add Customer
              </button>
            }
          />
        ) : (
          <DataTable
            columns={['Customer ID', 'Name', 'Email', 'Phone', 'Plan', 'Status']}
            rows={customers.map((c) => [
              <span key={`id-${c.id}`} className="font-mono text-xs text-slate-500">
                {typeof c.id === 'number' ? `CUS-${String(c.id).padStart(3, '0')}` : c.id}
              </span>,
              <span key={`name-${c.id}`} className="font-semibold">{c.name}</span>,
              c.email,
              c.phone || '—',
              c.plan || c.plan_name || c.company_name || '—',
              <span
                key={`status-${c.id}`}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(c.status)}`}
              >
                {formatStatus(c.status)}
              </span>,
            ])}
          />
        )}
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCustomerCreated}
      />
    </div>
  )
}
